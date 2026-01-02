# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following:

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-api-key-here

# WebSocket Server Port (Optional, defaults to 8080)
WEBSOCKET_PORT=8080

# Client-side WebSocket Port (Optional, defaults to 8080)
# This tells the browser which port to connect to
NEXT_PUBLIC_WEBSOCKET_PORT=8080
```

## Getting Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it into `.env.local`

## Important Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- The API key is used server-side only for security
- Make sure you have credits in your OpenAI account

