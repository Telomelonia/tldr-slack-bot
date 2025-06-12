import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authToken = searchParams.get('auth') || request.headers.get('authorization');
  
  // SECURITY: Multiple ways to authorize cron access
  const isVercelEnvironment = process.env.VERCEL === '1';
  const isVercelCron = request.headers.get('user-agent')?.includes('vercel') || 
                       request.headers.get('user-agent')?.includes('cron') ||
                       request.headers.get('x-vercel-cron') === '1';
  const hasValidAuth = authToken === process.env.TEST_AUTH_TOKEN;
  
  const isAutomaticCron = (isVercelEnvironment || isVercelCron) && !authToken;
  const isManualTest = hasValidAuth;
  
  if (!isAutomaticCron && !isManualTest) {
    console.log('❌ Unauthorized cron access attempt');
    return NextResponse.json(
      { error: 'Unauthorized - cron job access only' },
      { status: 401 }
    );
  }
  
  console.log('🚀 Daily TLDR job started (hybrid threading version)');
  
  try {
    // 1. Fetch TLDR content
    const tldrContent = await fetchAndCleanTLDR();
    
    // 2. Get active teams with bot tokens (hybrid approach)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, bot_token, channel_id, channel_name, webhook_url')
      .eq('is_active', true)
      .not('bot_token', 'is', null)
      .not('channel_id', 'is', null);

    if (teamsError) {
      throw new Error(`Database error fetching teams: ${teamsError.message}`);
    }

    console.log(`📊 Found ${teams?.length || 0} active teams with hybrid setup`);

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active teams with hybrid setup found',
        teamsProcessed: 0
      });
    }

    // 3. Send to each team with threading using bot token
    const results = [];
    for (const team of teams) {
      try {
        await sendThreadedMessageHybrid(team, tldrContent);
        results.push({ 
          team: team.team_name, 
          success: true, 
          channel: team.channel_name,
          method: 'threaded_bot_token'
        });
        console.log(`✅ Threaded message sent to ${team.team_name} in #${team.channel_name}`);
      } catch (error) {
        results.push({ 
          team: team.team_name, 
          success: false, 
          error: error.message 
        });
        console.log(`❌ Failed for ${team.team_name}: ${error.message}`);
      }
      
      // Delay between teams to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      teamsProcessed: teams.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// HYBRID: Use bot token for threading, but we already know the channel from webhook setup
async function sendThreadedMessageHybrid(team, content) {
  console.log(`🧵 Sending threaded message to ${team.team_name} in #${team.channel_name}`);
  
  try {
    // 1. Post the main message first using bot token
    const mainResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${team.bot_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: team.channel_id, // We got this from the webhook setup!
        text: content.main_message,
        username: "TLDR Newsletter Bot",
        icon_emoji: ":newspaper:",
        unfurl_links: false,
        unfurl_media: false
      })
    });

    const mainData = await mainResponse.json();
    
    if (!mainData.ok) {
      throw new Error(`Main message failed: ${mainData.error}`);
    }

    const mainTimestamp = mainData.ts;
    console.log(`📨 Main message posted to #${team.channel_name}, ts: ${mainTimestamp}`);

    // 2. Post each section as a threaded reply
    if (content.thread_replies && content.thread_replies.length > 0) {
      for (let i = 0; i < content.thread_replies.length; i++) {
        const reply = content.thread_replies[i];
        
        const replyResponse = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${team.bot_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: team.channel_id,
            text: reply,
            thread_ts: mainTimestamp, // This creates the thread!
            username: "TLDR Newsletter Bot",
            icon_emoji: ":newspaper:",
            unfurl_links: false,
            unfurl_media: false
          })
        });

        const replyData = await replyResponse.json();
        
        if (!replyData.ok) {
          console.error(`❌ Thread reply ${i + 1} failed: ${replyData.error}`);
          // Continue with other replies even if one fails
        } else {
          console.log(`📄 Thread reply ${i + 1} posted successfully`);
        }

        // Small delay between thread replies to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Update last posted timestamp
    await supabase
      .from('teams')
      .update({ 
        last_posted_at: new Date().toISOString()
      })
      .eq('team_id', team.team_id);

  } catch (error) {
    console.error(`❌ Threaded message failed for ${team.team_name}:`, error);
    throw error;
  }
}

// Keep your existing TLDR fetching functions unchanged
async function fetchAndCleanTLDR() {
  const response = await fetch('https://tldr.tech/api/latest/tech');
  const htmlContent = await response.text();
  const parsed = parseTldrNewsletter(htmlContent);
  const formatted = formatForSlack(parsed);
  return formatted;
}

function parseTldrNewsletter(htmlContent) {
  const $ = cheerio.load(htmlContent);
  
  const newsletterDate = $('h1.text-center.text-2xl.font-bold.mb-1').text().replace('TLDR ', '').trim();
  const newsletterTitle = $('h2.text-xl.text-center.pb-1').text().trim();
  
  const sections = {};
  
  $('section').each((i, section) => {
    const $section = $(section);
    
    if (!$section.find('article').length) return;
    
    const sectionHeader = $section.find('h3.text-center.font-bold').first();
    const sectionName = sectionHeader.text().trim() || 'Miscellaneous';
    
    const sectionArticles = [];
    $section.find('article.mt-3').each((j, article) => {
      const $article = $(article);
      const titleElem = $article.find('h3').first();
      const linkElem = $article.find('a.font-bold').first();
      const descElem = $article.find('div.newsletter-html').first();
      
      if (titleElem.length && linkElem.length && descElem.length) {
        const title = titleElem.text().trim();
        const description = descElem.text().trim();

        // Ignore articles containing "hiring" or "sponsor"
        if (title.toLowerCase().includes("hiring") || description.toLowerCase().includes("hiring") ||
            title.toLowerCase().includes("sponsor") || description.toLowerCase().includes("sponsor")) {
          return;
        }

        sectionArticles.push({
          title,
          link: linkElem.attr('href') || '',
          description
        });
      }
    });
    
    if (sectionArticles.length > 0) {
      sections[sectionName] = sectionArticles;
    }
  });
  
  return {
    date: newsletterDate,
    title: newsletterTitle,
    sections: sections
  };
}

function formatForSlack(parsedData) {
  const mainMessage = `*📰 TLDR Newsletter - ${parsedData.date}*\n${parsedData.title}`;
  
  const threadReplies = [];
  
  Object.entries(parsedData.sections).forEach(([sectionName, articles]) => {
    let sectionText = `*${sectionName}*\n\n`;
    
    articles.forEach(article => {
      sectionText += `• *<${article.link}|${article.title}>*\n`;
      sectionText += `${article.description}\n\n`;
    });
    
    threadReplies.push(sectionText);
  });
  
  return {
    main_message: mainMessage,
    thread_replies: threadReplies
  };
}
