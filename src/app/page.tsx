import Image from "next/image";

export default function Home() {
  const addToSlackUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}&scope=chat:write,chat:write.public&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL + '/api/auth/callback')}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          TLDR Newsletter Bot
        </h1>
        <p className="text-gray-600 mb-8">
          Get daily TLDR newsletter updates delivered to your Slack channel automatically.
        </p>
        <a
          href={addToSlackUrl}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <Image
            width={139}
            height={40}
            src="https://platform.slack-edge.com/img/add_to_slack.png" 
            alt="Add to Slack"
            className="h-10"
          />
        </a>
      </div>
    </div>
  );
}
