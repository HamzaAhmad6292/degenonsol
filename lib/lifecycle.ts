export type LifecycleStage = "born" | "baby" | "adult" | "old" | "dead"

export interface LifecycleInfo {
  stage: LifecycleStage
  canInteract: boolean
  systemMessage?: string
  nextStageIn?: number // ms until next stage
}

// Durations in milliseconds
const HOUR = 60 * 60 * 1000

export const STAGE_DURATIONS = {
  born: 1 * HOUR,
  baby: 4 * HOUR,
  adult: 4 * HOUR,
  old: 4 * HOUR,
  dead: 2 * HOUR,
}

export const CYCLE_DURATION = Object.values(STAGE_DURATIONS).reduce((a, b) => a + b, 0)

export function getLifecycleStage(serverStartTime: number): LifecycleInfo {
  const now = Date.now()
  // Hardening: avoid negative elapsed (clock skew) which would keep stage stuck at "born".
  const elapsed = Math.max(0, now - serverStartTime)
  const cyclePosition = elapsed % CYCLE_DURATION

  let accumulatedTime = 0

  // Born: 0 - 1h
  accumulatedTime += STAGE_DURATIONS.born
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "born",
      canInteract: false,
      systemMessage: "Degen was just born. She can't talk yet.",
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  // Baby: 1h - 5h
  accumulatedTime += STAGE_DURATIONS.baby
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "baby",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  // Adult: 5h - 9h
  accumulatedTime += STAGE_DURATIONS.adult
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "adult",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  // Old: 9h - 13h
  accumulatedTime += STAGE_DURATIONS.old
  if (cyclePosition < accumulatedTime) {
    return {
      stage: "old",
      canInteract: true,
      nextStageIn: accumulatedTime - cyclePosition
    }
  }

  // Dead: 13h - 15h
  return {
    stage: "dead",
    canInteract: false,
    systemMessage: "Degen is dead. You can't talk right now. Come back later.",
    nextStageIn: CYCLE_DURATION - cyclePosition
  }
}
