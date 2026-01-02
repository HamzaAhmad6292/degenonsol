# WebSocket Chat Setup with OpenSouls

## Overview

This setup provides a WebSocket-based chat service using OpenAI API with an OpenSouls-inspired personality for the $DEGEN Otter.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
WEBSOCKET_PORT=8080
NEXT_PUBLIC_WEBSOCKET_PORT=8080
```

### 2. Install Dependencies

Dependencies are already installed:
- `ws` - WebSocket server
- `@types/ws` - TypeScript types
- `openai` - OpenAI SDK

### 3. Start the WebSocket Server

You have two options:

#### Option A: Run as separate process (Recommended)

```bash
# In a separate terminal
npm run websocket:dev
```

Or manually:
```bash
node scripts/start-websocket-server.js
```

#### Option B: Integrate with Next.js (Advanced)

You can modify `next.config.mjs` to run the WebSocket server alongside Next.js, but it's recommended to run it separately for better reliability.

### 4. Start Next.js Development Server

```bash
npm run dev
```

The chat component will automatically:
1. Try to connect to WebSocket server
2. Fall back to REST API if WebSocket is unavailable

## Architecture

### Files Created

1. **`lib/otter-soul.ts`** - Soul configuration and personality
2. **`app/api/chat/route.ts`** - REST API endpoint (fallback)
3. **`server/websocket-server.ts`** - WebSocket server implementation
4. **`scripts/start-websocket-server.js`** - Script to start WebSocket server
5. **`components/otter-chat.tsx`** - Updated chat component with WebSocket support

### How It Works

1. **WebSocket Connection**: Client connects to WebSocket server on port 8080
2. **Message Flow**:
   - Client sends message via WebSocket
   - Server processes with OpenAI API
   - Server streams response back in chunks
   - Client displays streaming response
3. **Fallback**: If WebSocket fails, uses REST API endpoint

### Features

- ✅ Real-time streaming responses
- ✅ Conversation memory (last 20 messages)
- ✅ Typing indicators
- ✅ Error handling
- ✅ Automatic reconnection handling
- ✅ REST API fallback

## Testing

1. Start WebSocket server: `npm run websocket:dev`
2. Start Next.js: `npm run dev`
3. Navigate to `/chat`
4. Send a message and watch it stream in real-time!

## Troubleshooting

### WebSocket connection fails
- Check if WebSocket server is running on port 8080
- Verify `NEXT_PUBLIC_WEBSOCKET_PORT` matches server port
- Check browser console for connection errors
- The chat will automatically fall back to REST API

### OpenAI API errors
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check API key is valid and has credits
- Review server logs for detailed error messages

### Port conflicts
- Change `WEBSOCKET_PORT` in `.env.local` if 8080 is taken
- Update `NEXT_PUBLIC_WEBSOCKET_PORT` to match

## Production Deployment

For production:
1. Use a proper WebSocket service (e.g., Railway, Render, or custom server)
2. Update WebSocket URL in client code
3. Use Redis or database for conversation storage
4. Add authentication/rate limiting
5. Use environment variables for all secrets

