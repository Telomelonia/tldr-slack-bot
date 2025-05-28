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
      
      {/* Dev mode toggle */}
      <div className="absolute top-6 right-6 z-10">
        <label className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 cursor-pointer hover:bg-white/10 transition-all">
          <span className="text-white/70 text-sm font-medium">Dev Mode</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={devMode}
              onChange={(e) => setDevMode(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-all ${devMode ? 'bg-violet-500' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform ${devMode ? 'translate-x-6' : 'translate-x-1'} mt-1`}></div>
            </div>
          </div>
        </label>
      </div>

      <div className="relative max-w-2xl mx-auto text-center">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
          {/* Status indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">Work in Progress</span>
          </div>

          {/* Success icon */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-4">
            Almost Ready! 🚀
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            TLDR Newsletter Bot is being prepared for <span className="text-white font-semibold">{team || 'your workspace'}</span>.
            <br />We're putting the finishing touches on your experience.
          </p>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-left">
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Smart Scheduling</h3>
              <p className="text-white/60 text-sm">Daily updates at 9 AM EST, perfectly timed for your team</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 text-left">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">Curated Content</h3>
              <p className="text-white/60 text-sm">Hand-picked tech news and insights delivered seamlessly</p>
            </div>
          </div>

          {/* Action button */}
          <button
            disabled={!devMode}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              devMode 
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg hover:shadow-violet-500/25 transform hover:scale-105' 
                : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/20'
            }`}
          >
            {devMode ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configure Settings
              </>
            ) : (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white/60 rounded-full animate-spin"></div>
                Coming Soon
              </>
            )}
          </button>

          {/* Status text */}
          <p className="text-white/40 text-sm mt-6">
            {devMode ? 'Development mode enabled - full functionality available' : 'Enable dev mode to access configuration'}
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
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
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
