# Chat Page Setup Guide

## Overview

A new chat page has been created at `/chat` that features:
- Real-time token price monitoring (updates every 10 seconds)
- Animated GIF display that reacts to price movements
- Interactive chart background with color-coded glow effects
- Chat interface ready for OpenSouls AI integration

## Files Created

### Pages
- `app/chat/page.tsx` - Main chat page route

### Components
- `components/token-price-fetcher.tsx` - Hook for fetching Solana token prices
- `components/otter-gif-display.tsx` - GIF display with chart background
- `components/otter-chat.tsx` - Chat interface component

### Documentation
- `public/gifs/README.md` - Instructions for GIF files
- `components/otter-chat-opensouls-integration.md` - OpenSouls integration guide

## Setup Instructions

### 1. Add GIF Files

Place three GIF files in the `public/gifs/` folder:
- `happy.gif` - For when price increases
- `sad.gif` - For when price decreases or stays same
- `idle.gif` - Initial/default state

### 2. Token Configuration

The token address is already configured:
- **CA**: `4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump`
- **Price Source**: DexScreener API
- **Update Interval**: 10 seconds

### 3. OpenSouls Integration

The chat component currently uses mock responses. To integrate with OpenSouls:

1. Follow the guide in `components/otter-chat-opensouls-integration.md`
2. Update the `fetchOpenSoulsResponse` function in `components/otter-chat.tsx`
3. Configure your OpenSouls API endpoint

## Features

### Price Monitoring
- Fetches token price every 10 seconds
- Tracks price changes (up/down/same)
- Maintains price history for chart display

### GIF Display
- Automatically switches between happy/sad/idle GIFs
- Smooth transitions with Framer Motion
- Handles missing GIF files gracefully

### Chart Background
- Real-time price chart using Recharts
- Color-coded glow effects:
  - **Green glow** for price increases (happy)
  - **Red glow** for price decreases (sad)
  - **Gold glow** for idle state
- Gradient backgrounds matching the luxury theme

### Chat Interface
- Luxury glass effect styling
- Smooth animations
- Message history
- Loading states
- Ready for OpenSouls API integration

## Styling

All components follow the luxury glass effect theme:
- Backdrop blur effects
- Semi-transparent backgrounds
- Gold/primary color accents
- Smooth transitions
- Consistent with main page design

## Navigation

A "Chat with Otter" button has been added to the hero section on the main page (`components/luxury-hero.tsx`).

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/chat` or click "Chat with Otter" on the homepage
3. The page will:
   - Display the idle GIF initially
   - Start fetching token prices
   - Update GIF based on price movements
   - Show the chart in the background

## Troubleshooting

### GIFs not displaying
- Ensure GIF files are in `public/gifs/` folder
- Check file names are exactly: `happy.gif`, `sad.gif`, `idle.gif`
- Verify file format is GIF

### Price not updating
- Check browser console for API errors
- Verify token address is correct
- Check DexScreener API availability

### Chart not showing
- Ensure at least one price update has occurred
- Check browser console for Recharts errors
- Verify `recharts` is installed: `npm install recharts`

## Next Steps

1. Add your GIF files to `public/gifs/`
2. Set up OpenSouls integration (see integration guide)
3. Customize the otter's personality in OpenSouls
4. Test the complete flow

