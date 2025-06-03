'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const team = searchParams.get('team');
  const channel = searchParams.get('channel');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="relative max-w-2xl mx-auto text-center">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
          {/* Success icon */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-4">
            Bot Installed & Ready! 🎉
          </h1>
          
          {/* Dynamic subtitle based on setup type */}
          {channel ? (
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              TLDR Newsletter Bot is now configured for <span className="text-white font-semibold">{team || 'your workspace'}</span>.
              <br />
              Daily updates will be delivered to <span className="text-emerald-400 font-semibold">#{channel}</span> starting tomorrow at 9 AM JST.
            </p>
          ) : (
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              TLDR Newsletter Bot has been installed in <span className="text-white font-semibold">{team || 'your workspace'}</span>.
              <br />
              Setup is complete and ready to go!
            </p>
          )}

          {/* Status indicators */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Bot Configured</h3>
              <p className="text-white/60 text-sm">Automatic setup complete</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">No Setup Required</h3>
              <p className="text-white/60 text-sm">Everything is ready to go</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Daily Updates</h3>
              <p className="text-white/60 text-sm">Starting tomorrow at 9 AM JST</p>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-violet-200 font-semibold mb-2">What Happens Next?</h3>
                <div className="text-violet-300/80 text-sm space-y-2">
                  <p>✅ <strong>Bot is configured and ready</strong></p>
                  <p>✅ <strong>No additional setup required</strong></p>
                  <p>✅ <strong>Daily updates begin tomorrow at 9 AM JST</strong></p>
                  {channel && (
                    <p>📍 <strong>Updates will be delivered to #{channel}</strong></p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sample preview */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview of Daily Updates
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-violet-500 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-violet-300 font-semibold text-xs">TLDR Newsletter Bot</span>
                  <span className="text-gray-500 text-xs">9:00 AM</span>
                </div>
                <p className="text-white/90 text-sm font-semibold mb-1">📰 TLDR Newsletter - June 3, 2025</p>
                <p className="text-white/70 text-xs">The latest in tech, science, and programming delivered to your Slack</p>
                <div className="mt-2 text-xs text-blue-400">Click to view thread with full articles →</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <a
              href={`slack://open`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-violet-500/25 transform hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12h2.717v2.542H5.042a2.528 2.528 0 0 1-2.52 2.503Zm6.906-6.218a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 11.948 4h.023a2.528 2.528 0 0 1 2.517 2.523v2.542h-2.54V8.947Zm2.54 1.15a2.528 2.528 0 0 1 2.517-2.523A2.528 2.528 0 0 1 19.525 10.1a2.528 2.528 0 0 1-2.52 2.523h-2.517V10.1Zm-6.906 6.218a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 2.542 16.3a2.528 2.528 0 0 1 2.52-2.523h2.52v2.542Zm6.906-6.218a2.528 2.528 0 0 1 2.517 2.523A2.528 2.528 0 0 1 14.488 15.1a2.528 2.528 0 0 1-2.52-2.523v-2.523h2.517v2.523Z"/>
              </svg>
              Open Slack
            </a>
            
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Footer info */}
          <p className="text-white/40 text-sm">
            You can manage or remove this bot anytime from your Slack workspace settings
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}

export default function Success() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
