// /api/cron/route.js - Simplified version with guaranteed channel detection
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET() {
  console.log('🚀 Daily TLDR job started');
  
  try {
    // 1. Fetch TLDR content
    const tldrContent = await fetchAndCleanTLDR();
    
    // 2. Get only active teams with valid channels (simplified query)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, bot_token, channel_id, channel_name')
      .eq('is_active', true)
      .not('channel_id', 'is', null); // Only teams with valid channels

    if (teamsError) {
      throw new Error(`Database error fetching teams: ${teamsError.message}`);
    }

    console.log(`📊 Found ${teams?.length || 0} active teams with valid channels`);

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active teams with valid channels found',
        teamsProcessed: 0
      });
    }

    // 3. Send to each team (simplified - no channel detection needed)
    const results = [];
    for (const team of teams) {
      try {
        await sendTLDRToTeam(team, tldrContent);
        results.push({ 
          team: team.team_name, 
          success: true, 
          channel: team.channel_name
        });
        console.log(`✅ Sent to ${team.team_name} in channel #${team.channel_name}`);
      } catch (error) {
        results.push({ 
          team: team.team_name, 
          success: false, 
          error: error.message 
        });
        console.log(`❌ Failed for ${team.team_name}: ${error.message}`);
        
        // If posting failed due to permission issues, mark team as inactive
        if (error.message.includes('not_in_channel') || error.message.includes('channel_not_found')) {
          await handleTeamPermissionError(team.team_id, team.team_name);
        }
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

// Simplified function - no channel detection, just post to known channel
async function sendTLDRToTeam(team, content) {
  console.log(`📤 Posting to ${team.team_name} in #${team.channel_name}`);
  
  try {
    // Send main message to the known channel
    const mainResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${team.bot_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: team.channel_id,
        text: content.main_message,
        unfurl_links: false,
        unfurl_media: false,
        username: "TLDR Newsletter Bot"
      })
    });

    const mainData = await mainResponse.json();
    
    if (!mainData.ok) {
      throw new Error(`Slack API error: ${mainData.error}`);
    }

    // Send thread replies
    if (content.thread_replies && content.thread_replies.length > 0) {
      await sendThreadReplies(team.bot_token, team.channel_id, mainData.ts, content.thread_replies);
    }
    
    // Update last posted timestamp
    await supabase
      .from('teams')
      .update({ 
        last_posted_at: new Date().toISOString()
      })
      .eq('team_id', team.team_id);

    return { success: true };

  } catch (error) {
    console.error(`❌ Failed to post to ${team.team_name}:`, error);
    throw error;
  }
}

// Handle team permission errors by marking as inactive
async function handleTeamPermissionError(teamId, teamName) {
  try {
    console.log(`⚠️ Marking team ${teamName} as inactive due to permission error`);
    
    const { error } = await supabase
      .from('teams')
      .update({ 
        is_active: false,
        channel_id: null,
        channel_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('team_id', teamId);

    if (error) {
      console.error(`❌ Failed to update team ${teamName}:`, error);
    } else {
      console.log(`✅ Team ${teamName} marked as inactive`);
    }
  } catch (error) {
    console.error(`❌ Error handling permission error for ${teamName}:`, error);
  }
}

// Helper function for thread replies (unchanged)
async function sendThreadReplies(botToken, channelId, threadTs, threadReplies) {
  if (!threadReplies || threadReplies.length === 0) return;

  for (let i = 0; i < threadReplies.length; i++) {
    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channelId,
          text: threadReplies[i],
          thread_ts: threadTs,
          unfurl_links: false,
          unfurl_media: false,
          username: "TLDR Newsletter Bot"
        })
      });
      
      const data = await response.json();
      if (!data.ok) {
        console.error(`❌ Thread reply ${i + 1} failed:`, data.error);
      }
    } catch (error) {
      console.error(`❌ Thread reply ${i + 1} error:`, error);
    }
    
    // Small delay between thread messages
    await new Promise(resolve => setTimeout(resolve, 500));
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
