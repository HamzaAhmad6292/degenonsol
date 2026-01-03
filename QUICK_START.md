# Quick Start Guide - Chat with Otter

## 🚀 Setup in 3 Steps

### Step 1: Add OpenAI API Key

Create `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=sk-your-api-key-here
WEBSOCKET_PORT=8080
NEXT_PUBLIC_WEBSOCKET_PORT=8080
```

Get your API key from: https://platform.openai.com/api-keys

### Step 2: Start WebSocket Server

In one terminal:

```bash
npm run websocket:dev
```

You should see: `WebSocket server running on ws://localhost:8080`

### Step 3: Start Next.js

In another terminal:

```bash
npm run dev
```

### Step 4: Open Chat Page

Navigate to: http://localhost:3000/chat

Or click "Chat with Otter" button on the homepage!

## 🎉 That's It!

The chat will:
- ✅ Connect to WebSocket automatically
- ✅ Stream responses in real-time
- ✅ Fall back to REST API if WebSocket unavailable
- ✅ Remember conversation context

## Troubleshooting

**WebSocket connection fails?**
- Make sure WebSocket server is running (`npm run websocket:dev`)
- Check port 8080 is available
- Chat will automatically use REST API as fallback

**OpenAI errors?**
- Verify API key is correct in `.env.local`
- Check you have credits in OpenAI account
- Review server terminal for error messages

## Running Both Servers Together

You can run both in one command:

```bash
npm run dev:all
```

This starts both Next.js and WebSocket server simultaneously.

