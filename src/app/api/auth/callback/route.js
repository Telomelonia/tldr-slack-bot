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

    console.log(`🎯 OAuth successful for team: ${tokenData.team.name}`);

    // Get BOTH webhook info AND bot token
    const webhookInfo = tokenData.incoming_webhook;
    const botToken = tokenData.access_token;
    
    if (!webhookInfo || !webhookInfo.url) {
      throw new Error('No webhook information received');
    }

    if (!botToken) {
      throw new Error('No bot token received');
    }

    console.log(`📍 Webhook configured for channel: #${webhookInfo.channel}`);
    console.log(`🤖 Bot token received for threading capability`);

    // Store team data with BOTH webhook info AND bot token
    const { error: dbError } = await supabase
      .from('teams')
      .upsert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        webhook_url: webhookInfo.url,
        bot_token: botToken,
        channel_id: webhookInfo.channel_id,
        channel_name: webhookInfo.channel,
        installed_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'team_id'
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    console.log(`💾 Stored webhook + bot token for ${tokenData.team.name} → #${webhookInfo.channel}`);

    // Redirect to success page
    const successUrl = new URL(`${request.nextUrl.origin}/success`);
    successUrl.searchParams.set('team', tokenData.team.name);
    successUrl.searchParams.set('channel', webhookInfo.channel);
    successUrl.searchParams.set('setup', 'hybrid_configured');

    return NextResponse.redirect(successUrl.toString());

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=${encodeURIComponent(error.message)}`);
  }
}
