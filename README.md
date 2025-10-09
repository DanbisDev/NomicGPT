# NomicGPT

NomicGPT is a Discord bot that helps players navigate the ever-changing rules of a Nomic game. It listens for @mentions or replies, gathers recent conversation context, fetches the latest rules/agenda/player lists from GitHub, and replies using OpenAI with inline rule citations.

## Prerequisites

- Node.js 18+
- Discord bot token with Message Content intent enabled
- OpenAI API key
- GitHub personal access token (read access to the rules repository)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```ini
   DISCORD_TOKEN=your_bot_token
   OPENAI_API_KEY=your_openai_key
   GITHUB_TOKEN=your_github_pat
   ```
   Optional but recommended:
   ```ini
   CLIENT_ID=discord_application_id
   ```
3. Run the bot in development mode:
   ```bash
   npm run dev
   ```

## Local Development

- `npm run dev` – Start the bot with ts-node (no rebuild required)
- `npm run build` – Compile TypeScript to `dist/`
- `npm start` – Execute the compiled bot from `dist/`
- `npm run lint` – ESLint with TypeScript rules
- `npm test` – Jest unit tests (no live Discord/OpenAI calls)
- `npm run watch` – Incremental TypeScript compilation

## Testing & Quality

- Unit tests live in `tests/` and focus on pure logic (prompt composition, Discord helpers, formatting utilities).
- All tests run in CI and locally with `npm test`.
- Linting enforces strict TypeScript usage; CI will fail on lint errors.

## Discord Application Setup

1. Visit the [Discord Developer Portal](https://discord.com/developers/applications), create an application, and add a bot user.
2. Under *Bot* → *Privileged Gateway Intents*, enable **Message Content Intent**.
3. Generate an OAuth2 URL with the `bot` scope and permissions for sending messages, reading history, and adding reactions.
4. Invite the bot using the generated URL and copy the token into `.env` as `DISCORD_TOKEN`.

## GitHub & OpenAI Credentials

- Generate an OpenAI API key from the [OpenAI dashboard](https://platform.openai.com/).
- Create a GitHub personal access token with `repo` scope so the bot can read markdown files via the GitHub API.

## Project Structure

```
├── src/
│   ├── channel_util.ts     # Discord channel helpers
│   ├── discord_util.ts     # Formatting + context helpers
│   ├── github_grabber.ts   # GitHub content fetchers
│   ├── index.ts            # Bot entry point
│   └── prompt_builder.ts   # System prompt composition
├── tests/                  # Jest unit tests
├── .github/workflows/      # CI pipelines
├── jest.config.ts          # Jest configuration
├── tsconfig*.json          # TypeScript configurations
└── package.json
```

## How It Responds

- Mention the bot (`@NomicGPT`) or reply to an existing bot message.
- The bot gathers recent history (reply chain + recent channel messages) and channel metadata.
- Rules, agenda, and player rosters are fetched from GitHub on each request.
- Responses include inline links such as `[Rule 123](...)` for easy referencing.
- Messages longer than 2000 characters are automatically split into Discord-friendly chunks.

## Continuous Integration

GitHub Actions run linting, unit tests, and a TypeScript build on every pull request and push to `main`. See `.github/workflows/ci.yml` for details.

## License

MIT
