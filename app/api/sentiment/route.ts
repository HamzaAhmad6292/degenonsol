import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze the sentiment of the following text. 
          Return ONLY one of the following words: "positive", "negative", or "neutral".
          
          Examples:
          "I love this token!" -> positive
          "This is a scam" -> negative
          "What is the price?" -> neutral
          "LFG moon soon" -> positive
          "Rug pull incoming" -> negative
          `
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const sentiment = completion.choices[0]?.message?.content?.toLowerCase().trim() || "neutral";
    
    // Validate output
    const validSentiments = ["positive", "negative", "neutral"];
    const finalSentiment = validSentiments.includes(sentiment) ? sentiment : "neutral";

    return NextResponse.json({ sentiment: finalSentiment });
  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
