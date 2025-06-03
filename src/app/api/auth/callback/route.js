import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper function to get channels the bot has permission to access
async function getBotAllowedChannels(botToken) {
  try {
    const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200', {
      headers: {
        'Authorization': `Bearer ${botToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.log(`Slack API error in getBotAllowedChannels: ${data.error}`);
      return [];
    }

    // Filter to channels where bot has access and isn't archived
    const allowedChannels = data.channels?.filter(channel => 
      !channel.is_archived && 
      channel.is_member === true  // Bot is explicitly a member
    ) || [];

    return allowedChannels;
  } catch (error) {
    console.error('Error fetching bot allowed channels:', error);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=No authorization code received`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(`Slack OAuth error: ${tokenData.error}`);
    }

    console.log(`🔍 OAuth successful for team: ${tokenData.team.name}`);

    // Get channels the bot has permission to access
    const allowedChannels = await getBotAllowedChannels(tokenData.access_token);
    console.log(`📋 Found ${allowedChannels.length} allowed channels for ${tokenData.team.name}`);

    // Determine channel configuration based on admin permissions
    let channelId = null;
    let channelName = null;
    let isActive = false;
    let setupMessage = '';

    if (allowedChannels.length === 1) {
      // Perfect! Admin restricted to exactly one channel
      channelId = allowedChannels[0].id;
      channelName = allowedChannels[0].name;
      isActive = true;
      setupMessage = 'single_channel';
      console.log(`✅ Single channel detected: #${channelName}`);
      
    } else if (allowedChannels.length === 0) {
      // Admin hasn't granted channel access yet
      channelId = null;
      channelName = null;
      isActive = false;
      setupMessage = 'no_channel_access';
      console.log(`⚠️ No channel access granted for ${tokenData.team.name}`);
      
    } else {
      // Multiple channels - let user choose
      channelId = null;  // Don't set until user chooses
      channelName = null;
      isActive = false;  // Not active until channel is selected
      setupMessage = 'channel_selection_needed';
      console.log(`🔄 Multiple channels available (${allowedChannels.length}), user needs to choose`);
    }

    // Store team data with detected channel information
    const teamData = {
      team_id: tokenData.team.id,
      team_name: tokenData.team.name,
      bot_token: tokenData.access_token,
      channel_id: channelId,
      channel_name: channelName,
      installed_at: new Date().toISOString(),
      is_active: isActive  // Only active if we have a valid channel
    };

    // For multiple channels, also store available channels for selection
    if (setupMessage === 'channel_selection_needed') {
      teamData.available_channels = JSON.stringify(
        allowedChannels.map(ch => ({ id: ch.id, name: ch.name, is_private: ch.is_private || false }))
      );
    }

    const { error: dbError } = await supabase
      .from('teams')
      .upsert(teamData, {
        onConflict: 'team_id'
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    console.log(`💾 Stored team data: ${tokenData.team.name}, active: ${isActive}, channel: ${channelName || 'pending selection'}`);

    // Redirect to appropriate page based on setup result
    if (setupMessage === 'no_channel_access') {
      // Redirect to error page with specific message
      return NextResponse.redirect(
        `${request.nextUrl.origin}/error?message=${encodeURIComponent('workspace_admin_permissions')}`
      );
    }

    if (setupMessage === 'channel_selection_needed') {
      // Redirect to channel selection page
      const selectionUrl = new URL(`${request.nextUrl.origin}/select-channel`);
      selectionUrl.searchParams.set('team_id', tokenData.team.id);
      selectionUrl.searchParams.set('team_name', tokenData.team.name);
      return NextResponse.redirect(selectionUrl.toString());
    }

    // Redirect to success page with channel info
    const successUrl = new URL(`${request.nextUrl.origin}/success`);
    successUrl.searchParams.set('team', tokenData.team.name);
    successUrl.searchParams.set('setup', setupMessage);
    if (channelName) {
      successUrl.searchParams.set('channel', channelName);
    }

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=${encodeURIComponent(error.message)}`);
  }
}
