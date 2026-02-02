import type { GifState } from "@/app/chat/page"
import type { LifecycleInfo } from "@/lib/lifecycle"

/**
 * Same GIF path logic as FullscreenOtterDisplay - used by AR view so the same otter is shown.
 */
export function getGifPathForAr(gifState: GifState, lifecycle: LifecycleInfo): string {
  if (lifecycle.stage === "born") return "/gifs/lifecycle/born.gif"
  if (lifecycle.stage === "dead") return "/gifs/lifecycle/dead.gif"
  if (lifecycle.stage === "baby" || lifecycle.stage === "old") {
    const stage = lifecycle.stage
    let fileName = ""
    switch (gifState) {
      case "happy":
        fileName = "happy-speaking.gif"
        break
      case "sad":
        fileName = "sad-speaking.gif"
        break
      case "idle":
        fileName = "happy-idle.gif"
        break
      case "sad_idle":
        fileName = "sad-idle.gif"
        break
      case "slap":
        fileName = "slap.gif"
        break
      default:
        fileName = gifState.includes("sad") ? "sad-idle.gif" : "happy-idle.gif"
    }
    return `/gifs/lifecycle/${stage}/${fileName}`
  }
  return `/gifs/${gifState}.gif`
}
