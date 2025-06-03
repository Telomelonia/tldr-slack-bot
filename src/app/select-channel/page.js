'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SelectChannelContent() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team_id');
  const teamName = searchParams.get('team_name');

  useEffect(() => {
    const fetchAvailableChannels = async () => {
      try {
        const response = await fetch(`/api/get-channels?team_id=${teamId}`);
        const data = await response.json();
        
        if (data.success) {
          setChannels(data.channels);
          if (data.channels.length > 0) {
            setSelectedChannel(data.channels[0].id); // Default to first channel
          }
        } else {
          setError(data.error || 'Failed to fetch channels');
        }
      } catch (err) {
        setError('Failed to load channels', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableChannels();
  }, [teamId]);

  const handleSubmit = async () => {
    if (!selectedChannel) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/set-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          channel_id: selectedChannel
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to success page
        window.location.href = `/success?team=${encodeURIComponent(teamName)}&channel=${encodeURIComponent(data.channel_name)}&setup=channel_selected`;
      } else {
        setError(data.error || 'Failed to set channel');
      }
    } catch (err) {
      setError('Failed to save channel selection',  err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="relative max-w-2xl mx-auto">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
          {/* Icon */}
          <div className="mb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-2l-4 4z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-4 text-center">
            Choose Your Channel
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/60 text-lg mb-2 leading-relaxed text-center">
            Select which channel should receive daily TLDR updates for <span className="text-white font-semibold">{teamName}</span>
          </p>
          
          {/* Info note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-blue-300/80 text-sm">
                We currently support <strong>one channel per workspace</strong>. You can change this later by reinstalling the bot.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Channel selection */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Available Channels ({channels.length})
              </label>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {channels.map((channel) => (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedChannel === channel.id
                        ? 'bg-violet-500/20 border-violet-500/40 text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={channel.id}
                      checked={selectedChannel === channel.id}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-4 h-4 text-violet-500 border-white/20 bg-white/10 focus:ring-violet-500"
                    />
                    
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">
                        {channel.is_private ? '🔒' : '#'}
                      </span>
                      <span className="font-medium">
                        {channel.name}
                      </span>
                      {channel.is_private && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSubmit}
                disabled={!selectedChannel || submitting}
                className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-violet-500/25 transform hover:scale-105 disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help text */}
          <p className="text-white/40 text-sm mt-6 text-center">
            Daily TLDR updates will be delivered to your selected channel at 9 AM JST
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}

export default function SelectChannel() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SelectChannelContent />
    </Suspense>
  );
}
