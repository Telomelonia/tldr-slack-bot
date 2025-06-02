'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const team = searchParams.get('team');
  const [devMode, setDevMode] = useState(false);

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
            Bot Installed! 🎉
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            TLDR Newsletter Bot has been added to <span className="text-white font-semibold">{team || 'your workspace'}</span>.
          </p>

          {/* Important next step */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-amber-200 font-semibold mb-2">One More Step Required</h3>
                <p className="text-amber-300/80 text-sm leading-relaxed">
                  Please <strong>invite the bot to a channel</strong> where you want to receive daily TLDR updates. 
                  <br />
                  Go to any channel and type: <code className="bg-amber-500/20 px-2 py-1 rounded text-xs">/invite @TLDR Newsletter Bot</code>
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-left">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Auto-Detection</h3>
              <p className="text-white/60 text-sm">Bot will post to whichever channel it's invited to</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-left">
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Daily Updates</h3>
              <p className="text-white/60 text-sm">Starting tomorrow at 9 AM EST</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Setup Instructions
            </h3>
            <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
              <li>Go to the channel where you want TLDR updates</li>
              <li>Type: <code className="bg-white/10 px-2 py-1 rounded">/invite @TLDR Newsletter Bot</code></li>
              <li>That's it! Daily updates will start tomorrow at 9 AM EST</li>
            </ol>
          </div>

          {/* Status text */}
          <p className="text-white/40 text-sm">
            Bot will automatically detect and use whichever channel it's invited to
          </p>
        </div>
      </div>
    </div>
  );
}

// ... rest of component (Loading fallback, etc.)
export default function Success() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
