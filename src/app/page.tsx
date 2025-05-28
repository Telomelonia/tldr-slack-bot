"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  // This would need to be converted to a client component if you want state
  // For now, I'll show the structure with commented state logic
  
  const addToSlackUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}&scope=chat:write,chat:write.public&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/auth/callback')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Dev mode toggle - would need client component for state */}
      
      <div className="absolute top-6 right-6 z-10">
        <label className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2 cursor-pointer hover:bg-white/10 transition-all">
          <span className="text-white/70 text-sm font-medium">Dev Mode</span>
          <div className="relative">
            <input type="checkbox" className="sr-only" />
            <div className="w-11 h-6 bg-white/20 rounded-full">
              <div className="w-4 h-4 bg-white rounded-full shadow-lg transform translate-x-1 mt-1 transition-transform"></div>
            </div>
          </div>
        </label>
      </div>
     

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Glow effect */}
        <div className="absolute -inset-8 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-3xl blur-2xl"></div>
        
        <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-16 shadow-2xl">
          {/* Status indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">Work in Progress</span>
          </div>

          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-violet-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-6">
            TLDR Newsletter Bot
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/60 text-xl mb-12 leading-relaxed max-w-2xl mx-auto">
            Get daily TLDR newsletter updates delivered to your Slack channel automatically. 
            Stay informed with curated tech news without the noise.
          </p>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center hover:bg-white/[0.05] transition-all">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Automated Delivery</h3>
              <p className="text-white/60">Daily updates delivered at 9 AM EST, perfectly timed for your morning routine</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center hover:bg-white/[0.05] transition-all">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Curated Content</h3>
              <p className="text-white/60">Hand-picked tech news, startup insights, and industry trends</p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8 text-center hover:bg-white/[0.05] transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Zero Setup</h3>
              <p className="text-white/60">One-click installation, no configuration needed</p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            disabled={true}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 text-white/50 cursor-not-allowed border border-white/20 rounded-xl font-semibold text-lg transition-all"
          >
            <div className="w-6 h-6 border-2 border-white/30 border-t-white/60 rounded-full animate-spin"></div>
            Coming Soon to Slack
          </button>

          {/* Status text */}
          <p className="text-white/40 text-sm mt-6">
            We're putting the finishing touches on your experience
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-12 opacity-60">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-white/60 text-sm">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white/60 text-sm">Privacy Focused</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white/60 text-sm">Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}