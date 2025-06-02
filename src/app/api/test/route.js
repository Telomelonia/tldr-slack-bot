// /src/app/api/test/route.js - Test endpoint to debug bot functionality
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('team_id');
  
  console.log('🧪 Test endpoint called for team:', teamId);
  
  try {
    // Get team data from database
    let query = supabase.from('teams').select('*');
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      // If no team_id specified, get all teams
      query = query.eq('is_active', true);
    }
    
    const { data: teams, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No teams found',
        suggestion: teamId ? 'Check if team_id is correct' : 'Install the bot first'
      });
    }
    
    // Test each team
    const results = [];
    
    for (const team of teams) {
      console.log(`\n🔍 Testing team: ${team.team_name} (${team.team_id})`);
      
      const teamResult = {
        team_id: team.team_id,
        team_name: team.team_name,
        stored_channel_id: team.channel_id,
        stored_channel_name: team.channel_name
      };
      
      try {
        // 1. Test bot token validity
        const botTestResponse = await fetch('https://slack.com/api/auth.test', {
          headers: {
            'Authorization': `Bearer ${team.bot_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const botTestData = await botTestResponse.json();
        teamResult.bot_valid = botTestData.ok;
        teamResult.bot_user_id = botTestData.user_id;
        
        if (!botTestData.ok) {
          teamResult.error = `Bot token invalid: ${botTestData.error}`;
          results.push(teamResult);
          continue;
        }
        
        // 2. Get channels where bot is a member
        const channelsResponse = await fetch('https://slack.com/api/users.conversations?types=public_channel,private_channel&limit=200', {
          headers: {
            'Authorization': `Bearer ${team.bot_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const channelsData = await channelsResponse.json();
        
        if (channelsData.ok) {
          const memberChannels = channelsData.channels.filter(channel => 
            !channel.is_archived && channel.is_member
          );
          
          teamResult.bot_member_channels = memberChannels.map(c => ({
            id: c.id,
            name: c.name,
            is_private: c.is_private || false
          }));
          
          teamResult.channel_count = memberChannels.length;
          
          // 3. Test sending a message if bot is in channels
          if (memberChannels.length > 0) {
            const targetChannel = team.channel_id && memberChannels.find(c => c.id === team.channel_id) 
              ? team.channel_id 
              : memberChannels[0].id;
            
            const testMessage = `🧪 Test message from TLDR Bot - ${new Date().toLocaleTimeString()}`;
            
            const messageResponse = await fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${team.bot_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: targetChannel,
                text: testMessage,
                unfurl_links: false,
                unfurl_media: false,
                username: "TLDR Newsletter Bot"
              })
            });
            
            const messageData = await messageResponse.json();
            teamResult.message_sent = messageData.ok;
            teamResult.message_channel = memberChannels.find(c => c.id === targetChannel)?.name;
            teamResult.message_error = messageData.error;
            
            // 4. Update database with detected channel
            if (messageData.ok && (!team.channel_id || team.channel_id !== targetChannel)) {
              const usedChannel = memberChannels.find(c => c.id === targetChannel);
              
              await supabase
                .from('teams')
                .update({ 
                  channel_id: targetChannel,
                  channel_name: usedChannel.name,
                  last_posted_at: new Date().toISOString()
                })
                .eq('team_id', team.team_id);
              
              teamResult.database_updated = true;
              teamResult.new_channel_id = targetChannel;
              teamResult.new_channel_name = usedChannel.name;
            }
            
          } else {
            teamResult.error = 'Bot is not a member of any channels. Invite it to a channel first.';
          }
          
        } else {
          teamResult.error = `Failed to get channels: ${channelsData.error}`;
        }
        
      } catch (error) {
        teamResult.error = error.message;
      }
      
      results.push(teamResult);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      teams_tested: teams.length,
      results
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Also create a simple POST version for manual testing
export async function POST(request) {
  const body = await request.json();
  const { team_id, send_test_message } = body;
  
  if (send_test_message) {
    // Trigger actual TLDR content test
    return testTLDRContent(team_id);
  }
  
  // Default to GET behavior
  return GET(request);
}

async function testTLDRContent(teamId) {
  // Test with mock TLDR content
  const mockTLDRContent = {
    main_message: "🧪 *Test TLDR Newsletter - " + new Date().toLocaleDateString() + "*\nThis is a test of the TLDR newsletter bot",
    thread_replies: [
      "*🔥 Big Tech & Startups*\n\n• *Test Article 1*\nThis is a test description for the first article.\n\n• *Test Article 2*\nThis is a test description for the second article.\n\n",
      "*🚀 Science & Futuristic Technology*\n\n• *Test Article 3*\nThis is a test description for the third article.\n\n"
    ]
  };
  
  // Same logic as cron job but with test content
  // ... (implement full message sending with test content)
}