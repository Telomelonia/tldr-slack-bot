import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

    // Try to get the default channel or general channel
    let defaultChannel = null;
    try {
      const channelsResponse = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=50', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const channelsData = await channelsResponse.json();
      
      if (channelsData.ok && channelsData.channels) {
        // Look for #general first, then any public channel
        const generalChannel = channelsData.channels.find(ch => 
          ch.name === 'general' && !ch.is_archived
        );
        
        if (generalChannel) {
          defaultChannel = {
            id: generalChannel.id,
            name: generalChannel.name
          };
        } else {
          // Fall back to first available public channel
          const firstChannel = channelsData.channels.find(ch => !ch.is_archived);
          if (firstChannel) {
            defaultChannel = {
              id: firstChannel.id,
              name: firstChannel.name
            };
          }
        }
      }
    } catch (channelError) {
      console.log('Could not fetch channels during OAuth:', channelError);
      // Continue without channel info - will be detected later
    }

    // Store team data with potential default channel
    const { error: dbError } = await supabase
      .from('teams')
      .upsert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_token: tokenData.access_token,
        channel_id: defaultChannel?.id || null,
        channel_name: defaultChannel?.name || null,
        installed_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'team_id'
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    // Redirect to success page with channel info
    const successUrl = new URL(`${request.nextUrl.origin}/success`);
    successUrl.searchParams.set('team', tokenData.team.name);
    if (defaultChannel) {
      successUrl.searchParams.set('channel', defaultChannel.name);
    }

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=${encodeURIComponent(error.message)}`);
  }
}
