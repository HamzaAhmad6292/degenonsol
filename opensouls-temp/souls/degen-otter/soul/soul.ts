import { Soul, load } from "@opensouls/engine";
import initialProcess from "./initialProcess.js";

const soul: Soul = {
  name: "DegenOtter",
  initialProcess,
  staticMemories: {
    core: load("./staticMemories/core.md")
  }
}

export default soul
