import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL,
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
  
  // Allow if: Vercel environment + no auth token (automatic cron) OR valid auth token (manual)
  const isAutomaticCron = isVercelEnvironment && !authToken;
  const isManualTest = hasValidAuth;
  
  if (!isAutomaticCron && !isManualTest) {
    console.log('❌ Unauthorized cron access attempt');
    console.log('Vercel env:', isVercelEnvironment);
    console.log('User-Agent:', request.headers.get('user-agent'));
    console.log('Has auth token:', !!authToken);
    console.log('Auth valid:', hasValidAuth);
    
    return NextResponse.json(
      { error: 'Unauthorized - cron job access only' },
      { status: 401 }
    );
  }
  
  if (isAutomaticCron) {
    console.log('🤖 Automatic Vercel cron execution');
  } else {
    console.log('🔐 Manual cron execution with auth token');
  }
  
  console.log('🚀 Daily TLDR job started (webhook version)');
  
  try {
    // 1. Fetch TLDR content
    const tldrContent = await fetchAndCleanTLDR();
    
    // 2. Get active teams with webhooks
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, webhook_url, channel_name')
      .eq('is_active', true)
      .not('webhook_url', 'is', null);

    if (teamsError) {
      throw new Error(`Database error fetching teams: ${teamsError.message}`);
    }

    console.log(`📊 Found ${teams?.length || 0} active teams with webhooks`);

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active teams with webhooks found',
        teamsProcessed: 0
      });
    }

    // 3. Send to each team via webhook
    const results = [];
    for (const team of teams) {
      try {
        await sendViaWebhook(team, tldrContent);
        results.push({ 
          team: team.team_name, 
          success: true, 
          channel: team.channel_name
        });
        console.log(`✅ Webhook sent to ${team.team_name} in #${team.channel_name}`);
      } catch (error) {
        results.push({ 
          team: team.team_name, 
          success: false, 
          error: error.message 
        });
        console.log(`❌ Failed for ${team.team_name}: ${error.message}`);
      }
      
      // Delay between teams to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
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

// Send via webhook - much simpler!
async function sendViaWebhook(team, content) {
  console.log(`🪝 Sending webhook to ${team.team_name}`);
  
  try {
    // Create full message (main + all sections)
    let fullMessage = content.main_message + '\n\n';
    
    if (content.thread_replies && content.thread_replies.length > 0) {
      fullMessage += content.thread_replies.join('\n\n');
    }

    // Send via webhook
    const response = await fetch(team.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: fullMessage,
        username: "TLDR Newsletter Bot",
        icon_emoji: ":newspaper:",
        unfurl_links: false,
        unfurl_media: false
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    // Update last posted timestamp
    await supabase
      .from('teams')
      .update({ 
        last_posted_at: new Date().toISOString()
      })
      .eq('team_id', team.team_id);

  } catch (error) {
    console.error(`❌ Webhook failed for ${team.team_name}:`, error);
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
        sectionArticles.push({
          title: titleElem.text().trim(),
          link: linkElem.attr('href') || '',
          description: descElem.text().trim()
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
