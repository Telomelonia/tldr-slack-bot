'use client';
import { useSearchParams } from 'next/navigation';

export default function Success() {
  const searchParams = useSearchParams();
  const team = searchParams.get('team');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Installation Successful! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          TLDR Newsletter Bot has been added to <strong>{team}</strong>.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
          <ol className="text-sm text-blue-800 text-left space-y-1">
            <li>1. Invite the bot to your desired channel</li>
            <li>2. The bot will post daily TLDR updates at 9 AM EST</li>
            <li>3. Enjoy your automated newsletter updates!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}