# Discord LoLdle

A Discord bot that lets server members play LoLdle — a League of Legends champion guessing game.

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application", give it a name
3. Go to the **Bot** tab and click "Reset Token" — copy the token
4. Go to the **OAuth2** tab, copy the **Application ID** (this is your Client ID)
5. Under OAuth2 > URL Generator, select `bot` and `applications.commands` scopes, then `Send Messages` and `Use Application Commands` permissions
6. Use the generated URL to invite the bot to your server

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:
- `DISCORD_TOKEN` — your bot token
- `CLIENT_ID` — your application ID
- `GUILD_ID` — your server ID (for instant command registration during dev; remove for global)

### 3. Install and Run

```bash
npm install
npm run deploy-commands   # Register slash commands with Discord
npm run dev               # Start the bot in development mode
```

### 4. Production (pm2)

```bash
npm run build
pm2 start ecosystem.config.js
```

## Commands

| Command | Description |
|---------|-------------|
| `/guess <champion>` | Guess a champion (with autocomplete) |
| `/loldle status` | Show your current game state |
| `/loldle giveup` | Give up and reveal the answer |
| `/loldle refresh` | Re-fetch Data Dragon data (admin) |
| `/loldle addchampion` | Add data for a new champion (admin) |
| `/leaderboard [period]` | Server leaderboard (today/week/alltime) |
| `/stats [user]` | Personal stats |

## How It Works

Each day, a champion is deterministically selected as the answer. Players use `/guess` to guess champions and receive feedback on 7 properties:

- Gender
- Position(s)
- Species
- Range Type (Melee/Ranged)
- Region
- Resource Type
- Release Year

Feedback uses colored indicators: green (correct), orange (partial match), red (incorrect), and arrows for release year (higher/lower).
