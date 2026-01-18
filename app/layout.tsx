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
  title: "$DEGEN - Community-Driven Solana Token",
  description: "A community-driven meme token on Solana. Join our community and learn more about the $DEGEN ecosystem.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#0F1F12] text-foreground antialiased selection:bg-primary/30 selection:text-primary min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
