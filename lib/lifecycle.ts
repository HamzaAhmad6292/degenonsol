export type LifecycleStage = "born" | "baby" | "adult" | "old" | "dead"

export interface LifecycleInfo {
  stage: LifecycleStage
  canInteract: boolean
  systemMessage?: string
  nextStageIn?: number // ms until next stage
}

// Stage duration: 10 minutes each (local + Vercel).
const STAGE_MS = 10 * 60 * 1000

export const STAGE_DURATIONS = {
  born: STAGE_MS,
  baby: STAGE_MS,
  adult: STAGE_MS,
  old: STAGE_MS,
  dead: STAGE_MS,
}

export const CYCLE_DURATION = Object.values(STAGE_DURATIONS).reduce((a, b) => a + b, 0)

export function getLifecycleStage(serverStartTime: number): LifecycleInfo {
  const now = Date.now()
  // Hardening: avoid negative elapsed (clock skew) which would keep stage stuck at "born".
  const elapsed = Math.max(0, now - serverStartTime)
  const cyclePosition = elapsed % CYCLE_DURATION

  let accumulatedTime = 0

  // Born → baby → adult → old → dead (30s each)
  accumulatedTime += STAGE_DURATIONS.born
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "born",
      canInteract: false,
      systemMessage: "Degen was just born. She can't talk yet.",
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  accumulatedTime += STAGE_DURATIONS.baby
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "baby",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  accumulatedTime += STAGE_DURATIONS.adult
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "adult",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  accumulatedTime += STAGE_DURATIONS.old
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "old",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  // dead
  return {
    stage: "dead",
    canInteract: false,
    systemMessage: "Degen is dead. You can't talk right now. Come back later.",
    nextStageIn: CYCLE_DURATION - cyclePosition
  }
}
