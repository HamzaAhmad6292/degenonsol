export type LifecycleStage = "born" | "baby" | "adult" | "old" | "dead"

export interface LifecycleInfo {
  stage: LifecycleStage
  canInteract: boolean
  systemMessage?: string
  nextStageIn?: number // ms until next stage
}

/** Use when lifecycle is disabled (e.g. localhost) - always adult, can interact */
export const LIFECYCLE_ADULT: LifecycleInfo = {
  stage: "adult",
  canInteract: true,
}

// Durations in milliseconds
const HOUR = 60 * 60 * 1000

// Lifecycle timing:
// - born: 1 hour
// - baby: 4 hours
// - adult: 4 hours
// - old: 4 hours
// - dead: 1 hour
export const STAGE_DURATIONS = {
  born: 1 * HOUR,
  baby: 4 * HOUR,
  adult: 4 * HOUR,
  old: 4 * HOUR,
  dead: 1 * HOUR,
}

export const CYCLE_DURATION = Object.values(STAGE_DURATIONS).reduce((a, b) => a + b, 0)

// Use a fixed global epoch so lifecycle is deterministic across
// serverless invocations and deployments (good for Vercel free tier).
// This makes the lifecycle purely a function of wall-clock time.
const GLOBAL_EPOCH = Date.UTC(2025, 0, 1, 0, 0, 0, 0)

export function getLifecycleStage(now: number = Date.now()): LifecycleInfo {
  const elapsed = now - GLOBAL_EPOCH
  const cyclePosition = ((elapsed % CYCLE_DURATION) + CYCLE_DURATION) % CYCLE_DURATION

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
