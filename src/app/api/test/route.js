// /src/app/api/test/route.js - SECURE version with auth
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authToken = searchParams.get('auth') || request.headers.get('authorization');
  const teamId = searchParams.get('team_id');
  
  // SECURITY: Require auth token
  if (authToken !== process.env.TEST_AUTH_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized - missing or invalid auth token' },
      { status: 401 }
    );
  }
  
  console.log('🧪 Authorized test endpoint called');
  
  try {
    // Get team data from database
    let query = supabase.from('teams').select('team_id, team_name, channel_id, channel_name, is_active');
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      query = query.eq('is_active', true);
    }
    
    const { data: teams, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No teams found'
      });
    }
    
    // Test each team (but don't expose bot tokens)
    const results = [];
    
    for (const team of teams) {
      console.log(`🔍 Testing team: ${team.team_name}`);
      
      // Get full team data (including bot_token) from database
      const { data: fullTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('team_id', team.team_id)
        .single();
      
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
            'Authorization': `Bearer ${fullTeam.bot_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const botTestData = await botTestResponse.json();
        teamResult.bot_valid = botTestData.ok;
        
        if (!botTestData.ok) {
          teamResult.error = `Bot token issue: ${botTestData.error}`;
          results.push(teamResult);
          continue;
        }
        
        // 2. Try to get bot's conversations (channels it's in)
        const conversationsResponse = await fetch('https://slack.com/api/users.conversations?types=public_channel,private_channel&limit=200', {
          headers: {
            'Authorization': `Bearer ${fullTeam.bot_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const conversationsData = await conversationsResponse.json();
        
        if (conversationsData.ok) {
          const memberChannels = conversationsData.channels.filter(channel => 
            !channel.is_archived && channel.is_member
          );
          
          teamResult.bot_member_channels = memberChannels.map(c => ({
            id: c.id,
            name: c.name
          }));
          teamResult.channel_count = memberChannels.length;
          
          // 3. Try sending a test message if bot is in channels
          if (memberChannels.length > 0) {
            const targetChannel = memberChannels[0]; // Use first available
            
            const testMessageResponse = await fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${fullTeam.bot_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: targetChannel.id,
                text: `🧪 Bot test successful! Channel detection working. Time: ${new Date().toLocaleTimeString()}`,
                unfurl_links: false,
                unfurl_media: false,
                username: "TLDR Newsletter Bot"
              })
            });
            
            const messageData = await testMessageResponse.json();
            teamResult.test_message_sent = messageData.ok;
            teamResult.test_channel = targetChannel.name;
            
            if (messageData.ok) {
              // Update database with detected channel
              await supabase
                .from('teams')
                .update({ 
                  channel_id: targetChannel.id,
                  channel_name: targetChannel.name,
                  last_posted_at: new Date().toISOString()
                })
                .eq('team_id', team.team_id);
              
              teamResult.database_updated = true;
              teamResult.updated_channel_id = targetChannel.id;
              teamResult.updated_channel_name = targetChannel.name;
            } else {
              teamResult.message_error = messageData.error;
            }
            
          } else {
            teamResult.error = 'Bot not in any channels. Invite bot with: /invite @TLDR Newsletter Bot';
          }
          
        } else {
          // Handle missing scope error specifically
          if (conversationsData.error === 'missing_scope') {
            teamResult.error = 'Missing channels:read scope. Bot can still post but cannot auto-detect channels.';
            teamResult.solution = 'We can try posting to #general or the channel you specify';
            
            // Try posting to #general as fallback
            const generalTestResponse = await fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${fullTeam.bot_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                channel: '#general',
                text: `🧪 Bot test - posting to #general. Time: ${new Date().toLocaleTimeString()}`,
                unfurl_links: false,
                unfurl_media: false,
                username: "TLDR Newsletter Bot"
              })
            });
            
            const generalData = await generalTestResponse.json();
            teamResult.general_post_test = generalData.ok;
            teamResult.general_error = generalData.error;
            
            if (generalData.ok) {
              await supabase
                .from('teams')
                .update({ 
                  channel_id: '#general',
                  channel_name: 'general',
                  last_posted_at: new Date().toISOString()
                })
                .eq('team_id', team.team_id);
              
              teamResult.database_updated = true;
              teamResult.fallback_channel = '#general';
            }
            
          } else {
            teamResult.error = `Channels API error: ${conversationsData.error}`;
          }
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
      results,
      security_note: "Bot tokens are not exposed in this response"
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
