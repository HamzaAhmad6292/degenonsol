// Sentiment analyzer for chat messages to detect praise/bullish vs negative/bearish

export type Sentiment = "positive" | "negative" | "neutral"

// Keywords for positive sentiment (praise, bullish)
const positiveKeywords = [
  "praise", "praising", "love", "loving", "amazing", "awesome", "great", "best", "excellent",
  "bullish", "bull", "moon", "rocket", "pump", "gains", "profit", "win", "winning",
  "hodl", "diamond hands", "to the moon", "let's go", "pump it", "buy", "buying",
  "good", "great", "fantastic", "wonderful", "brilliant", "genius", "smart", "clever",
  "cute", "adorable", "cool", "sick", "fire", "lit", "amazing otter", "best otter",
  "degen", "degen vibes", "vibes", "positive", "optimistic", "excited", "pumped"
]

// Keywords for negative sentiment (criticism, bearish)
const negativeKeywords = [
  "hate", "hating", "bad", "worst", "terrible", "awful", "sucks", "trash", "garbage",
  "bearish", "bear", "dump", "crash", "loss", "losing", "sell", "selling", "rug",
  "scam", "dead", "dying", "over", "finished", "done", "stupid", "dumb", "idiot",
  "ugly", "annoying", "boring", "lame", "weak", "pathetic", "disappointed", "sad",
  "negative", "pessimistic", "worried", "concerned", "fear", "scared", "dump it"
]

export function analyzeSentiment(message: string): Sentiment {
  const lowerMessage = message.toLowerCase()
  
  // Check for positive keywords
  const positiveMatches = positiveKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length
  
  // Check for negative keywords
  const negativeMatches = negativeKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length
  
  // Check for specific patterns
  const bullishPatterns = [
    /\b(bull|bullish|moon|rocket|pump|hodl|diamond hands|to the moon|let's go)\b/i,
    /\b(buy|buying|gains|profit|win|winning)\b/i,
    /\b(love|praise|amazing|awesome|great|best)\s+(otter|degen|token)\b/i,
  ]
  
  const bearishPatterns = [
    /\b(bear|bearish|dump|crash|sell|selling|rug|scam)\b/i,
    /\b(hate|bad|worst|terrible|sucks|trash)\s+(otter|degen|token)\b/i,
  ]
  
  const bullishMatches = bullishPatterns.filter(pattern => pattern.test(message)).length
  const bearishMatches = bearishPatterns.filter(pattern => pattern.test(message)).length
  
  // Calculate sentiment score
  const positiveScore = positiveMatches + bullishMatches * 2
  const negativeScore = negativeMatches + bearishMatches * 2
  
  if (positiveScore > negativeScore && positiveScore > 0) {
    return "positive"
  } else if (negativeScore > positiveScore && negativeScore > 0) {
    return "negative"
  }
  
  return "neutral"
}

