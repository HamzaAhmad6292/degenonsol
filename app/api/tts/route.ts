import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, mood } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Map mood to speed
    // "nova" is generally energetic and good for excited tones
    const voice = "nova"; 
    let speed = 1.0;

    switch (mood) {
      case "angry":
        speed = 1.2;
        break;
      case "excited":
        speed = 1.15; // Slightly faster for more energy
        break;
      case "depressed":
        speed = 0.8; 
        break;
      default:
        speed = 1.05; // Default slightly faster for engagement
        break;
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
