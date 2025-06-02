// /api/cron/route.js - Main daily job (replaces your PipeDream cron)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio'; // npm install cheerio

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET() {
  console.log('🚀 Daily TLDR job started');
  
  try {
    // 1. Fetch TLDR content (same as your PipeDream step 2)
    const tldrContent = await fetchAndCleanTLDR();
    
    // 2. Get all active teams from database
    const { data: teams } = await supabase
      .from('teams')
      .select('team_id, team_name, bot_token, channel_id')
      .eq('is_active', true);

    console.log(`📊 Found ${teams.length} active teams`);

    // 3. Send to each team (replaces your single hardcoded send)
    const results = [];
    for (const team of teams) {
      try {
        await sendTLDRToTeam(team, tldrContent);
        results.push({ team: team.team_name, success: true });
        console.log(`✅ Sent to ${team.team_name}`);
      } catch (error) {
        results.push({ team: team.team_name, success: false, error: error.message });
        console.log(`❌ Failed for ${team.team_name}: ${error.message}`);
      }
      
      // Small delay between teams to avoid rate limits
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Step 1: Fetch from TLDR API (same as your PipeDream step)
async function fetchAndCleanTLDR() {
  // Fetch the HTML content
  const response = await fetch('https://tldr.tech/api/latest/tech');
  const htmlContent = await response.text();
  
  // Parse and clean (JavaScript version of your Python code)
  const parsed = parseTldrNewsletter(htmlContent);
  const formatted = formatForSlack(parsed);
  
  return formatted;
}

// JavaScript version of your Python parsing function
function parseTldrNewsletter(htmlContent) {
  const $ = cheerio.load(htmlContent);
  
  // Extract newsletter metadata
  const newsletterDate = $('h1.text-center.text-2xl.font-bold.mb-1').text().replace('TLDR ', '').trim();
  const newsletterTitle = $('h2.text-xl.text-center.pb-1').text().trim();
  
  // Extract sections and articles
  const sections = {};
  
  $('section').each((i, section) => {
    const $section = $(section);
    
    // Skip empty sections
    if (!$section.find('article').length) return;
    
    // Find section header
    const sectionHeader = $section.find('h3.text-center.font-bold').first();
    const sectionName = sectionHeader.text().trim() || 'Miscellaneous';
    
    // Extract articles in this section
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
    
    // Only add section if it has articles
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

// JavaScript version of your Python formatting function
function formatForSlack(parsedData) {
  // Format main message
  const mainMessage = `*📰 TLDR Newsletter - ${parsedData.date}*\n${parsedData.title}`;
  
  // Format thread replies (one per section)
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

// Send to individual team (adapted from your PipeDream Slack code)
async function sendTLDRToTeam(team, content) {
  try {
    // Get channels where bot is a member
    const botChannels = await getBotMemberChannels(team.bot_token);
    
    if (botChannels.length === 0) {
      console.log(`⚠️ Bot not in any channels for ${team.team_name} - skipping`);
      return { success: false, reason: 'Bot not invited to any channels' };
    }

    // Use stored channel_id if available, otherwise use first available channel
    let targetChannel = team.channel_id;
    
    if (!targetChannel || !botChannels.find(c => c.id === targetChannel)) {
      // Bot not in stored channel (or no stored channel), use first available
      targetChannel = botChannels[0].id;
      
      // Update database with active channel
      await supabase
        .from('teams')
        .update({ 
          channel_id: targetChannel,
          channel_name: botChannels[0].name 
        })
        .eq('team_id', team.team_id);
      
      console.log(`📍 Using channel #${botChannels[0].name} for ${team.team_name}`);
    }

    // Send main message
    const mainResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${team.bot_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: targetChannel,
        text: content.main_message,
        unfurl_links: false,
        unfurl_media: false,
        username: "TLDR Newsletter Bot"
      })
    });

    const mainData = await mainResponse.json();
    
    if (!mainData.ok) {
      // If posting failed, try other channels bot is in
      if (mainData.error === 'not_in_channel' && botChannels.length > 1) {
        console.log(`Trying alternative channel for ${team.team_name}`);
        
        for (const channel of botChannels.slice(1)) {
          const retryResponse = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${team.bot_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channel: channel.id,
              text: content.main_message,
              unfurl_links: false,
              unfurl_media: false,
              username: "TLDR Newsletter Bot"
            })
          });

          const retryData = await retryResponse.json();
          if (retryData.ok) {
            // Update successful channel
            await supabase
              .from('teams')
              .update({ 
                channel_id: channel.id,
                channel_name: channel.name 
              })
              .eq('team_id', team.team_id);
            
            console.log(`✅ Posted to #${channel.name} for ${team.team_name}`);
            await sendThreadReplies(team.bot_token, channel.id, retryData.ts, content.thread_replies);
            return { success: true, channel: channel.name };
          }
        }
      }
      
      throw new Error(`Slack API error: ${mainData.error}`);
    }

    // Send thread replies
    await sendThreadReplies(team.bot_token, targetChannel, mainData.ts, content.thread_replies);
    
    console.log(`✅ Successfully posted to ${team.team_name}`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Failed to post to ${team.team_name}:`, error);
    throw error;
  }
}

// Get channels where bot is actually a member
async function getBotMemberChannels(botToken) {
  try {
    const response = await fetch('https://slack.com/api/users.conversations?types=public_channel,private_channel&limit=200', {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.ok) {
      // Filter to channels where bot can post
      return data.channels.filter(channel => 
        !channel.is_archived && // Not archived
        channel.is_member // Bot is a member
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error getting bot channels:', error);
    return [];
  }
}

// Helper function for thread replies
async function sendThreadReplies(botToken, channelId, threadTs, threadReplies) {
  if (!threadReplies || threadReplies.length === 0) return;

  for (let i = 0; i < threadReplies.length; i++) {
    await fetch('https://slack.com/api/chat.postMessage', {
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
    
    // Small delay between thread messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
