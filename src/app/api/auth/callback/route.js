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

    // Store team data WITHOUT channel info - we'll detect it when bot is invited
    const { error: dbError } = await supabase
      .from('teams')
      .upsert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_token: tokenData.access_token,
        channel_id: null,
        channel_name: null,
        installed_at: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'team_id'
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    // Redirect to success page with instructions
    return NextResponse.redirect(`${request.nextUrl.origin}/success?team=${encodeURIComponent(tokenData.team.name)}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/error?message=${encodeURIComponent(error.message)}`);
  }
}