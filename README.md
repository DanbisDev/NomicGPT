# Nomic Discord Bot

A Discord bot built with TypeScript for managing Nomic game rules and providing AI assistance.

## Features

- `/ping` slash command that responds with "Pong!"
- `/ask` command to ask questions to GPT-5-Nano
- `/rules` command to fetch current Nomic rules from GitHub
- Built with TypeScript and Discord.js v14
- Environment variable configuration

## Setup

### Prerequisites

- Node.js (v16 or higher)
- A Discord application and bot token
- OpenAI API key
- GitHub Personal Access Token (for fetching rules)

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_application_id_here
   OPENAI_API_KEY=your_openai_api_key_here
   GITHUB_TOKEN=your_github_token_here
   ```

### Getting Discord Bot Credentials

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token and paste it as `DISCORD_TOKEN`
5. Go to the "General Information" section and copy the Application ID as `CLIENT_ID`
6. In the "OAuth2" > "URL Generator" section:
   - Select "bot" and "applications.commands" scopes
   - Select necessary permissions (Send Messages, Use Slash Commands)
   - Use the generated URL to invite your bot to a server

## Usage

### Development

Run the bot in development mode with hot reload:
```bash
npm run dev
```

### Production

Build and run the bot:
```bash
npm run build
npm start
```

### Available Commands

- `/ping` - Responds with "Pong!"
- `/ask <question>` - Ask GPT-5-Nano a question
- `/rules` - Fetch and display current Nomic rules from GitHub

### Getting API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it as `OPENAI_API_KEY`

#### GitHub Personal Access Token
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Nomic Bot")
4. Select the `repo` scope (to read repository contents)
5. Generate the token and copy it
6. Paste it as `GITHUB_TOKEN`

## Project Structure

```
├── src/
│   └── index.ts          # Main bot file
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── env.example           # Environment variables template
└── README.md            # This file
```

## Scripts

- `npm run dev` - Run bot in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled bot
- `npm run watch` - Watch for changes and recompile

## License

MIT
