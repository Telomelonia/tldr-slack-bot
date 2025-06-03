'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'An unknown error occurred';

  // Determine error type and customize content
  const getErrorInfo = (errorMessage) => {
    switch (errorMessage) {
      case 'workspace_admin_permissions':
        return {
          title: 'Channel Access Required',
          description: 'The workspace admin needs to grant the bot access to at least one channel during installation.',
          icon: '🔒',
          actionText: 'Ask your workspace admin to reinstall and grant channel access',
          showRetry: true,
          bgColor: 'from-amber-950 via-orange-950 to-amber-950',
          glowColor: 'from-amber-600/20 via-orange-600/20 to-amber-600/20'
        };
      case 'no_channel_access':
        return {
          title: 'No Channel Access',
          description: 'The bot needs access to at least one channel to function properly.',
          icon: '📢',
          actionText: 'Please ensure the bot has channel permissions',
          showRetry: true,
          bgColor: 'from-amber-950 via-orange-950 to-amber-950',
          glowColor: 'from-amber-600/20 via-orange-600/20 to-amber-600/20'
        };
      default:
        return {
          title: 'Installation Failed',
          description: errorMessage,
          icon: '⚠️',
          actionText: 'Please try again or contact support',
          showRetry: true,
          bgColor: 'from-slate-950 via-red-950 to-slate-950',
          glowColor: 'from-red-600/20 via-orange-600/20 to-red-600/20'
        };
    }
  };

  const errorInfo = getErrorInfo(message);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${errorInfo.bgColor} flex items-center justify-center p-4`}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent_50%)]"></div>
      
      <div className="relative max-w-2xl mx-auto text-center">
        {/* Glow effect */}
        <div className={`absolute -inset-4 bg-gradient-to-r ${errorInfo.glowColor} rounded-3xl blur-xl`}></div>
        
        <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
          {/* Error icon */}
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">{errorInfo.icon}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent mb-4">
            {errorInfo.title}
          </h1>
          
          {/* Error message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <p className="text-red-300 text-lg leading-relaxed">
              {errorInfo.description}
            </p>
          </div>

          {/* Specific instructions for channel access errors */}
          {(message === 'workspace_admin_permissions' || message === 'no_channel_access') && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Fix This
              </h3>
              <ol className="text-blue-300/80 text-sm space-y-2 list-decimal list-inside">
                <li>Ask your <strong>workspace admin</strong> to click {"Add to Slack"} again</li>
                <li>During installation, the admin should <strong>grant channel access</strong> when prompted</li>
                <li>The bot needs permission to post in <strong>at least one channel</strong></li>
                <li>Once granted, setup will complete automatically</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {errorInfo.showRetry && (
              <Link
                href="/"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-violet-500/25 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </Link>
            )}
            
            <Link
              href="https://github.com/your-repo/tldr-slack-bot/issues"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
          </div>

          {/* Help text */}
          <p className="text-white/40 text-sm mt-8">
            {message === 'workspace_admin_permissions' 
              ? 'Only workspace admins can install apps and grant channel permissions'
              : 'If this error persists, please contact support with the error message above'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}

export default function Error() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}
