// /src/app/api/set-channel/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { team_id, channel_id } = await request.json();

    if (!team_id || !channel_id) {
      return NextResponse.json({
        success: false,
        error: 'Team ID and Channel ID are required'
      }, { status: 400 });
    }

    // Get team data including available channels
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('available_channels, team_name')
      .eq('team_id', team_id)
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

    // Validate that the selected channel is in the available channels
    let availableChannels = [];
    if (team.available_channels) {
      try {
        availableChannels = JSON.parse(team.available_channels);
      } catch (parseError) {
        throw new Error('Invalid channel data', parseError);
      }
    }

    const selectedChannel = availableChannels.find(ch => ch.id === channel_id);
    if (!selectedChannel) {
      return NextResponse.json({
        success: false,
        error: 'Selected channel is not available'
      }, { status: 400 });
    }

    // Update team with selected channel and set as active
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        channel_id: selectedChannel.id,
        channel_name: selectedChannel.name,
        is_active: true,
        available_channels: null, // Clear this as it's no longer needed
        updated_at: new Date().toISOString()
      })
      .eq('team_id', team_id);

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    console.log(`✅ Channel set for ${team.team_name}: #${selectedChannel.name}`);

    return NextResponse.json({
      success: true,
      channel_name: selectedChannel.name,
      channel_id: selectedChannel.id
    });

  } catch (error) {
    console.error('Set channel error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}