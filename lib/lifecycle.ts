export type LifecycleStage = "born" | "baby" | "adult" | "old" | "dead"

export interface LifecycleInfo {
  stage: LifecycleStage
  canInteract: boolean
  systemMessage?: string
  nextStageIn?: number // ms until next stage
}

// Stage duration: 10 minutes each (used when born/dead logic is enabled).
const STAGE_MS = 10 * 60 * 1000

export const STAGE_DURATIONS = {
  born: STAGE_MS,
  baby: STAGE_MS,
  adult: STAGE_MS,
  old: STAGE_MS,
  dead: STAGE_MS,
}

export const CYCLE_DURATION = Object.values(STAGE_DURATIONS).reduce((a, b) => a + b, 0)

const HOUR_MS = 60 * 60 * 1000
/** 8 hours in ms — each of the 3 states (baby, adult, old) gets 8h of the 24h day */
const EIGHT_HOURS_MS = 8 * HOUR_MS

/**
 * Current time of day in milliseconds since midnight (local time).
 */
function getMsSinceMidnight(): number {
  const now = new Date()
  return (
    now.getHours() * HOUR_MS +
    now.getMinutes() * 60000 +
    now.getSeconds() * 1000 +
    now.getMilliseconds()
  )
}

export function getLifecycleStage(_serverStartTime: number): LifecycleInfo {
  const msSinceMidnight = getMsSinceMidnight()

  // 24h day split into 3 states of 8 hours each (time-of-day based)
  if (msSinceMidnight < EIGHT_HOURS_MS) {
    return {
      stage: "baby",
      canInteract: true,
      nextStageIn: EIGHT_HOURS_MS - msSinceMidnight,
    }
  }
  if (msSinceMidnight < 2 * EIGHT_HOURS_MS) {
    return {
      stage: "adult",
      canInteract: true,
      nextStageIn: 2 * EIGHT_HOURS_MS - msSinceMidnight,
    }
  }
  return {
    stage: "old",
    canInteract: true,
    nextStageIn: 24 * HOUR_MS - msSinceMidnight,
  }

  // --- Commented out: born and dead states (kept for reference) ---
  // const now = Date.now()
  // const elapsed = Math.max(0, now - _serverStartTime)
  // const cyclePosition = elapsed % CYCLE_DURATION
  // let accumulatedTime = 0
  //
  // accumulatedTime += STAGE_DURATIONS.born
  // if (cyclePosition < accumulatedTime) {
  //   return {
  //     stage: "born",
  //     canInteract: false,
  //     systemMessage: "Degen was just born. She can't talk yet.",
  //     nextStageIn: accumulatedTime - cyclePosition
  //   }
  // }
  //
  // accumulatedTime += STAGE_DURATIONS.baby
  // if (cyclePosition < accumulatedTime) {
  //   return { stage: "baby", canInteract: true, nextStageIn: accumulatedTime - cyclePosition }
  // }
  //
  // accumulatedTime += STAGE_DURATIONS.adult
  // if (cyclePosition < accumulatedTime) {
  //   return { stage: "adult", canInteract: true, nextStageIn: accumulatedTime - cyclePosition }
  // }
  //
  // accumulatedTime += STAGE_DURATIONS.old
  // if (cyclePosition < accumulatedTime) {
  //   return { stage: "old", canInteract: true, nextStageIn: accumulatedTime - cyclePosition }
  // }
  //
  // return {
  //   stage: "dead",
  //   canInteract: false,
  //   systemMessage: "Degen is dead. You can't talk right now. Come back later.",
  //   nextStageIn: CYCLE_DURATION - cyclePosition
  // }
}
