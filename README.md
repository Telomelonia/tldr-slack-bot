# TLDR Newsletter Bot 📰

> Because who has time to actually browse the internet for tech news?

A Slack bot that delivers daily TLDR newsletter summaries straight to your workspace. Built by a solo dev who got tired of manually checking tech news every morning.

## What It Does

- Fetches the latest TLDR newsletter content
- Posts daily summaries to your chosen Slack channel at 9 AM JST
- Uses webhooks for reliable delivery (no bot invitation drama)
- Supports one channel per workspace (because simplicity is beautiful)

## Features

- **Zero Setup**: OAuth with built-in channel selection
- **Automatic Delivery**: Daily updates without manual intervention
- **Webhook-Based**: No bot permissions to manage or lose
- **Thread Organization**: Main post + threaded article sections
- **Error Handling**: Graceful failures and logging

## Installation

1. Click "Add to Slack" on our landing page
2. Select which channel should receive updates
3. Done. Seriously, that's it.

The bot will start delivering content the next day at 9 AM JST.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Web Scraping**: Cheerio
- **Authentication**: Slack OAuth 2.0 with incoming webhooks

## Development Setup

```bash
# Clone and install
git clone <repo-url>
npm install

# Environment variables
cp .env.example .env
# Fill in your Slack app credentials and Supabase details

# Database setup
# Run the SQL schema in schema.sql

# Start development server
npm run dev
```

### Environment Variables

```bash
# Slack OAuth
NEXT_PUBLIC_SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=your_deployed_url

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Optional: API testing
TEST_AUTH_TOKEN=your_secret_test_token
```

## API Endpoints

### Daily Newsletter Delivery

```
GET /api/cron
```

Triggered daily at 9 AM JST. Fetches TLDR content and delivers to all active workspaces.

### OAuth Callback

```
GET /api/auth/callback
```

Handles Slack OAuth flow and webhook configuration.

### Testing (Protected)

```
GET /api/test?auth=TEST_AUTH_TOKEN
```

Test endpoint for verifying webhook delivery. Requires `TEST_AUTH_TOKEN` for security.

## Database Schema

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_id VARCHAR UNIQUE NOT NULL,
  team_name VARCHAR NOT NULL,
  webhook_url TEXT,
  channel_id VARCHAR,
  channel_name VARCHAR,
  is_active BOOLEAN DEFAULT true,
  installed_at TIMESTAMP DEFAULT NOW(),
  last_posted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment

Works on any platform that supports Next.js:

- **Vercel**: Deploy with one click
- **Railway**: Easy Node.js hosting
- **Heroku**: Classic choice
- **Your VPS**: If you're into that sort of thing

Don't forget to set up a cron job or scheduled function to hit `/api/cron` daily.

## How It Works

1. **OAuth**: User authorizes app with webhook permissions
2. **Webhook Setup**: Slack provides direct posting URL for selected channel
3. **Content Fetching**: Daily job scrapes TLDR newsletter
4. **Parsing**: Extracts articles and formats for Slack
5. **Delivery**: Posts via webhook (reliable, no auth needed)

## Why Webhooks?

Originally built with bot tokens and complex channel detection. Webhooks are simpler:

- ✅ Admin picks channel during installation
- ✅ No bot membership management
- ✅ Can't lose permissions unexpectedly
- ✅ Works with private channels
- ✅ Less code, fewer bugs

## Contributing

This is a solo project, but PRs are welcome if you spot bugs or have improvements.

Please:

- Keep it simple
- Add tests for new features
- Update this README if needed

## License

Use it, modify it, deploy it, whatever makes you happy.

## Support

Found a bug? Open an issue. Need a feature? Also open an issue, but temper your expectations.

Built with ☕ and mild frustration at having to manually check tech news every day.

---

_Made by a developer who believes in automation > manual work_
[@telomelonia](https://github.com/Telomelonia)
