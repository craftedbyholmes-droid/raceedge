# RaceEdge

AI-powered UK horse racing tips. Rambling Robbie (jumps) and Punter Pat (flat). £5 EW daily.

## Quick Start

### 1. Edit .env.local
Fill in all values - Supabase, TheRacingAPI, Anthropic, Stripe.

### 2. Set up Supabase database
Go to your Supabase project > SQL Editor, paste and run supabase_schema.sql.

### 3. Run locally
npm run dev

### 4. Deploy
npx vercel
Add all environment variables in the Vercel dashboard.

## Cron Schedule (UTC)
- 00:00  Midnight (copy tomorrow to today, score, cache, picks)
- 07:00  Fetch racecards (today + tomorrow)
- 07:10  Score all runners
- 07:20  Build cache (top 2 per race)
- 07:30  Generate tipster picks
- 07:40  Fetch yesterday results
- 07:50  Settle picks
- 11:00  Midday update
- 14:00  Afternoon update
- 12-22  Hourly results fetch
- 22:30  Final daily settle

## Tipsters
Rambling Robbie (AJ) - National Hunt, Chase and Hurdle
Punter Pat (TC) - Flat racing only
Both make 1 pick per day at £5 each way (£10 total stake).
Non-runners are voided. NR detection: race has results but horse does not.

## Layout
Three columns: Ad (300px) | Content (max 640px) | Ad (300px)
Ad columns hidden on screens below 900px.