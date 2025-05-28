import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect('/error?message=' + encodeURIComponent(error));
  }

  if (!code) {
    return res.redirect('/error?message=No authorization code received');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      throw new Error(tokenData.error || 'OAuth exchange failed');
    }

    // Store team data in database
    const { data, error: dbError } = await supabase
      .from('teams')
      .upsert({
        team_id: tokenData.team.id,
        team_name: tokenData.team.name,
        bot_token: tokenData.access_token,
      }, {
        onConflict: 'team_id'
      });

    if (dbError) {
      throw new Error('Database error: ' + dbError.message);
    }

    // Redirect to success page
    res.redirect('/success?team=' + encodeURIComponent(tokenData.team.name));

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/error?message=' + encodeURIComponent(error.message));
  }
}