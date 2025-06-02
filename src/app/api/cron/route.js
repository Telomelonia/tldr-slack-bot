// /api/cron/route.js - Fixed version with better channel detection
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
    
    // 2. Get all active teams from database
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_name, bot_token, channel_id, channel_name')
      .eq('is_active', true);

    if (teamsError) {
      throw new Error(`Database error fetching teams: ${teamsError.message}`);
    }

    console.log(`📊 Found ${teams?.length || 0} active teams`);

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active teams found',
        teamsProcessed: 0
      });
    }

    // 3. Send to each team
    const results = [];
    for (const team of teams) {
      try {
        const result = await sendTLDRToTeam(team, tldrContent);
        results.push({ 
          team: team.team_name, 
          success: true, 
          channel: result.channel,
          updated: result.updated 
        });
        console.log(`✅ Sent to ${team.team_name} in channel #${result.channel}`);
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

// Send to individual team with improved channel detection
async function sendTLDRToTeam(team, content) {
  try {
    console.log(`🔍 Processing team: ${team.team_name}`);
    
    // Get channels where bot is a member
    const botChannels = await getBotMemberChannels(team.bot_token);
    console.log(`📋 Bot is member of ${botChannels.length} channels for ${team.team_name}`);
    
    if (botChannels.length === 0) {
      throw new Error('Bot not invited to any channels. Please invite the bot to a channel first.');
    }

    // Determine target channel
    let targetChannel = null;
    let targetChannelName = null;
    let channelUpdated = false;

    // Try stored channel first (if exists and bot is still member)
    if (team.channel_id) {
      const storedChannel = botChannels.find(c => c.id === team.channel_id);
      if (storedChannel) {
        targetChannel = team.channel_id;
        targetChannelName = storedChannel.name;
        console.log(`✅ Using stored channel #${targetChannelName} for ${team.team_name}`);
      } else {
        console.log(`⚠️ Bot no longer in stored channel ${team.channel_id} for ${team.team_name}`);
      }
    }

    // If no valid stored channel, use first available
    if (!targetChannel) {
      targetChannel = botChannels[0].id;
      targetChannelName = botChannels[0].name;
      channelUpdated = true;
      
      console.log(`🔄 Updating to new channel #${targetChannelName} for ${team.team_name}`);
      
      // Update database with new channel
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          channel_id: targetChannel,
          channel_name: targetChannelName,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', team.team_id);

      if (updateError) {
        console.error(`❌ Failed to update channel for ${team.team_name}:`, updateError);
        // Continue anyway - posting is more important than DB update
      } else {
        console.log(`✅ Updated channel in database for ${team.team_name}`);
      }
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
      // If posting failed, try other channels
      if (mainData.error === 'not_in_channel' && botChannels.length > 1) {
        console.log(`🔄 Primary channel failed, trying alternatives for ${team.team_name}`);
        
        for (let i = 1; i < botChannels.length; i++) {
          const altChannel = botChannels[i];
          
          const retryResponse = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${team.bot_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channel: altChannel.id,
              text: content.main_message,
              unfurl_links: false,
              unfurl_media: false,
              username: "TLDR Newsletter Bot"
            })
          });

          const retryData = await retryResponse.json();
          if (retryData.ok) {
            // Update to successful channel
            const { error: updateError } = await supabase
              .from('teams')
              .update({ 
                channel_id: altChannel.id,
                channel_name: altChannel.name,
                updated_at: new Date().toISOString()
              })
              .eq('team_id', team.team_id);

            if (updateError) {
              console.error(`❌ Failed to update alternative channel:`, updateError);
            }
            
            console.log(`✅ Posted to alternative channel #${altChannel.name} for ${team.team_name}`);
            await sendThreadReplies(team.bot_token, altChannel.id, retryData.ts, content.thread_replies);
            
            return { 
              success: true, 
              channel: altChannel.name,
              updated: true
            };
          }
        }
      }
      
      throw new Error(`Slack API error: ${mainData.error} - ${mainData.error || 'Unknown error'}`);
    }

    // Send thread replies
    if (content.thread_replies && content.thread_replies.length > 0) {
      await sendThreadReplies(team.bot_token, targetChannel, mainData.ts, content.thread_replies);
    }
    
    return { 
      success: true, 
      channel: targetChannelName,
      updated: channelUpdated
    };

  } catch (error) {
    console.error(`❌ Failed to post to ${team.team_name}:`, error);
    throw error;
  }
}

// Improved function to get channels where bot is actually a member
async function getBotMemberChannels(botToken) {
  try {
    console.log('🔍 Fetching bot member channels...');
    
    const response = await fetch('https://slack.com/api/users.conversations?types=public_channel,private_channel&limit=200', {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
    // Filter to channels where bot can post
    const validChannels = data.channels.filter(channel => 
      !channel.is_archived &&  // Not archived
      channel.is_member &&     // Bot is a member
      !channel.is_im &&        // Not a direct message
      !channel.is_mpim         // Not a multi-person direct message
    );

    console.log(`📋 Found ${validChannels.length} valid channels out of ${data.channels.length} total`);
    
    return validChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private || false
    }));
    
  } catch (error) {
    console.error('❌ Error getting bot channels:', error);
    return [];
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
