# NomicGPT — Nomic Discord Bot

A Discord bot built with TypeScript for playing Nomic: responds to @mentions, cites rules inline with links to your GitHub `rules.md`, and maintains rich conversation context through reply chains. This project is 95% AI generated 

## Features

- **@mention Q&A**: Ask questions by mentioning the bot in any channel
- **Smart Reply Context**: Maintains conversation history including both user and bot messages (up to 6 user messages)
- **Live Rules & Scores Sync**: Fetches the latest `rules.md` and `scores.md` from GitHub
- **Inline Citations**: Converts references like `Rule 123` to markdown links to that rule anchor
- **Message Splitting**: Automatically splits long responses into multiple messages (Discord 2000 char limit)
- **TypeScript + Discord.js v14**

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

4. In the Discord Developer Portal (Bot settings), enable Privileged Gateway Intents:
   - Message Content Intent (required for @mention and replies)
   - Guild Members Intent (optional, only if needed later)

### Getting Discord Bot Credentials

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token and paste it as `DISCORD_TOKEN`
5. Go to the "General Information" section and copy the Application ID as `CLIENT_ID`
6. In the "OAuth2" > "URL Generator" section:
   - Select "bot" scope
   - Select necessary permissions (Send Messages, Read Message History, Add Reactions)
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

### Available Interactions

- `@NomicGPT ...` — Mention the bot to ask a question
  - Reply to the bot's message to continue the conversation
  - Bot maintains context of both user and bot messages (up to 6 user messages)
  - Long responses are automatically split into multiple messages

### Example Usage

```
User: @NomicGPT What does Rule 123 say?
Bot: [Rule 123](https://github.com/SirRender00/nomic/blob/main/rules.md#123) states that...

User: [replies] Can you give me an example?
Bot: Here's an example of Rule 123 in practice...

User: [replies] What about exceptions?
Bot: The exceptions to Rule 123 are...
```

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

## Key Features Explained

### Smart Context Management
- **Reply Chain Traversal**: When you reply to the bot, it walks up the reply chain to gather context
- **Bidirectional History**: Includes both your messages and the bot's previous responses
- **Minimum User Messages**: Ensures at least 6 user messages are included for rich context
- **Mention Priority**: If you both mention and reply to the bot, reply context takes priority

### Message Handling
- **Automatic Splitting**: Long responses are split at natural boundaries (paragraphs, sentences)
- **Discord Compliant**: All messages stay under the 2000 character limit
- **Seamless Flow**: Multiple message chunks appear as a natural conversation

### Rule Integration
- **Live Sync**: Always uses the latest rules and scores from your GitHub repository
- **Smart Citations**: Automatically converts rule references to clickable links
- **Context Awareness**: Understands rule relationships and interactions

## Project Structure

```
├── src/
│   └── index.ts          # Main bot file
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Scripts

- `npm run dev` - Run bot in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled bot
- `npm run watch` - Watch for changes and recompile

## License

MIT
