// /src/app/api/get-channels/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('team_id');

  if (!teamId) {
    return NextResponse.json({
      success: false,
      error: 'Team ID is required'
    }, { status: 400 });
  }

  try {
    // Get team data from database
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('available_channels')
      .eq('team_id', teamId)
      .single();

    if (teamError) {
      throw new Error(`Database error: ${teamError.message}`);
    }

    if (!team) {
      return NextResponse.json({
        success: false,
        error: 'Team not found'
      }, { status: 404 });
    }

    // Parse available channels
    let channels = [];
    if (team.available_channels) {
      try {
        channels = JSON.parse(team.available_channels);
      } catch (parseError) {
        console.error('Error parsing available channels:', parseError);
        return NextResponse.json({
          success: false,
          error: 'Invalid channel data'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      channels: channels
    });

  } catch (error) {
    console.error('Get channels error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}