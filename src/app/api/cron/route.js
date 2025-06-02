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
  const { main_message, thread_replies } = content;
  
  // Send main message
  const mainResponse = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${team.bot_token}`, // Different token per team
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: team.channel_id || '#general', // Different channel per team
      text: main_message,
      unfurl_links: false,
      unfurl_media: false,
      username: "TLDR Newsletter Bot"
    })
  });

  const mainData = await mainResponse.json();
  
  if (!mainData.ok) {
    throw new Error(`Slack API error: ${mainData.error}`);
  }

  const messageTs = mainData.ts;
  
  // Send thread replies (same pattern as your PipeDream code)
  for (let i = 0; i < thread_replies.length; i++) {
    const threadResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${team.bot_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel: team.channel_id || '#general',
        text: thread_replies[i],
        thread_ts: messageTs,
        unfurl_links: false,
        unfurl_media: false,
        username: "TLDR Newsletter Bot"
      })
    });

    const threadData = await threadResponse.json();
    
    if (!threadData.ok) {
      console.log(`Thread reply ${i + 1} failed:`, threadData.error);
    }
    
    // Delay between messages (same as your code)
    if (i < thread_replies.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
