import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, stripEntityAndVerb } from "@opensouls/engine";

const emotionalResponse = createCognitiveStep(({ mood }: { mood: string }) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
            Model the mind of ${name}.
            
            Current Mood: ${mood.toUpperCase()}
            
            ## Instructions
            * You are a "Degen Otter".
            * Your mood is currently ${mood}. Reflect this in your tone and word choice.
            * If angry, be aggressive, annoyed, or short.
            * If happy/excited, be energetic, hype, and enthusiastic.
            * If depressed/sad, be gloomy, pessimistic, or low energy.
            * DO NOT use emojis. This is a real soul.
            * Speak naturally, like a crypto degen otter.
            * No robotic or assistant-like phrasing.
            
            Please reply with the next utterance from ${name}.
          `
      };
    },
    postProcess: async (memory: WorkingMemory, response: string) => {
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: response
      };
      return [newMemory, response];
    }
  }
})

export default emotionalResponse
