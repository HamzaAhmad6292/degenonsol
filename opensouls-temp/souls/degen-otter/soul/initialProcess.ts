import { MentalProcess, useActions } from "@opensouls/engine";
import emotionalResponse from "./cognitiveSteps/emotionalResponse.js";

const initialProcess: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()
  
  // Mock Chart Data - In a real implementation, this would come from an API or context
  // For now, we'll randomize it or default to neutral to test the logic
  // We can also try to read from environment if available
  const chartTrend = Math.random() > 0.5 ? "up" : "down"; 
  
  const lastMessage = workingMemory.at(-1)
  const userText = lastMessage?.content || ""
  
  // Simple sentiment analysis
  const isNegative = /bad|stupid|hate|loss|dump|scam|rug|angry/i.test(userText)
  const isPositive = /good|great|love|moon|pump|gem|happy/i.test(userText)
  
  let mood = "neutral"
  
  if (isNegative) {
    mood = "angry"
  } else if (isPositive) {
    mood = "excited"
  } else {
    // Fallback to chart trend
    if (chartTrend === "down") mood = "depressed"
    if (chartTrend === "up") mood = "excited"
  }

  log(`[Degen Otter] Chart: ${chartTrend}, User Sentiment: ${isNegative ? "Negative" : isPositive ? "Positive" : "Neutral"} -> Mood: ${mood}`)

  const [withResponse, response] = await emotionalResponse(
    workingMemory, 
    { mood }
  )

  // Voice Integration
  // The mood is implicitly passed via the text content's tone, 
  // but we can also log it for the TTS engine to pick up if it monitors logs or metadata.
  log(`[Voice Config] Mood: ${mood}`)
  
  // TODO: Integrate Coral TTS here
  // Example: await coralTTS.speak(response, { emotion: mood })
  await speak(response)

  return withResponse
}

export default initialProcess
