# OpenSouls Integration Guide

## Current Implementation

The chat component (`components/otter-chat.tsx`) currently uses a mock response function. To integrate with OpenSouls, you'll need to:

## Option 1: Direct API Integration

If you have OpenSouls running as a service, update the `fetchOpenSoulsResponse` function in `components/otter-chat.tsx`:

```typescript
const fetchOpenSoulsResponse = async (userMessage: string): Promise<string> => {
  try {
    const response = await fetch('YOUR_OPENSOULS_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        // Add any other required parameters
      }),
    })
    
    const data = await response.json()
    return data.response || data.message || "I'm not sure how to respond to that!"
  } catch (error) {
    console.error('OpenSouls API error:', error)
    throw error
  }
}
```

## Option 2: Next.js API Route

Create an API route at `app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    // Call OpenSouls API or service
    const response = await fetch('YOUR_OPENSOULS_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify({ message }),
    })
    
    const data = await response.json()
    return NextResponse.json({ response: data.response })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    )
  }
}
```

Then update `components/otter-chat.tsx`:

```typescript
const fetchOpenSoulsResponse = async (userMessage: string): Promise<string> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: userMessage }),
  })
  
  const data = await response.json()
  return data.response
}
```

## Option 3: WebSocket Connection

For real-time streaming responses, you can use WebSocket:

```typescript
const [ws, setWs] = useState<WebSocket | null>(null)

useEffect(() => {
  const websocket = new WebSocket('ws://your-opensouls-websocket-url')
  
  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // Handle streaming message
  }
  
  setWs(websocket)
  return () => websocket.close()
}, [])

const sendMessage = (message: string) => {
  if (ws) {
    ws.send(JSON.stringify({ message }))
  }
}
```

## OpenSouls Setup

Refer to the OpenSouls documentation at: https://github.com/opensouls/opensouls

You may need to:
1. Set up OpenSouls locally or use their cloud service
2. Configure API keys/authentication
3. Create a soul configuration for the otter character
4. Deploy or connect to the OpenSouls service

