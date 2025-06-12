// /src/app/api/test-webhook/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  
  console.log('🔐 Authorized test request');
  
  try {
    // Get team data from database
    let query = supabase
      .from('teams')
      .select('team_id, team_name, webhook_url, channel_name')
      .eq('is_active', true)
      .not('webhook_url', 'is', null);
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data: teams, error } = await query;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!teams || teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No teams with webhooks found'
      });
    }
    
    // Send test message to each team
    const results = [];
    
    for (const team of teams) {
      console.log(`🧪 Testing webhook for: ${team.team_name}`);
      
      try {
        const testMessage = {
          text: `🧪 *Test Message* - ${new Date().toLocaleString()}\n\nTLDR Newsletter Bot is working correctly! This is a test message to verify the webhook connection.\n\n✅ Webhook is configured\n✅ Channel: #${team.channel_name}\n✅ Ready for daily updates`,
          username: "TLDR Newsletter Bot",
          icon_emoji: ":test_tube:",
          unfurl_links: false,
          unfurl_media: false
        };

        const response = await fetch(team.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testMessage)
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        results.push({
          team_id: team.team_id,
          team_name: team.team_name,
          channel_name: team.channel_name,
          success: true,
          message: 'Test message sent successfully'
        });

        // Update last posted timestamp
        await supabase
          .from('teams')
          .update({ 
            last_posted_at: new Date().toISOString()
          })
          .eq('team_id', team.team_id);

        console.log(`✅ Test successful for ${team.team_name}`);

      } catch (error) {
        results.push({
          team_id: team.team_id,
          team_name: team.team_name,
          channel_name: team.channel_name,
          success: false,
          error: error.message
        });
        
        console.log(`❌ Test failed for ${team.team_name}: ${error.message}`);
      }
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
