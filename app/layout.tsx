import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "$degen - The First Otter on Solana",
  description: "100% Organic. 100% Degen. The Tiktok Viral Otter is on Solana.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

import { CustomCursor } from "@/components/custom-cursor"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#0F1F12] text-foreground antialiased selection:bg-primary/30 selection:text-primary">
        <CustomCursor />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
