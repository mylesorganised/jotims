"use client";

import type { ToolId } from "@/content/types";
import { MorseTool } from "./morse";
import { PersuasionTool } from "./persuasion";
import { PhoneticTool } from "./phonetic";
import { SemaphoreTool } from "./semaphore";
import { EmojiTool, FactOpinionTool, LeafGuideTool, PasswordTool, TimelineTool, TimerTool } from "./small-tools";

export function Tool({ id }: { id: ToolId }) {
  switch (id) {
    case "morse":
      return <MorseTool />;
    case "phonetic":
      return <PhoneticTool />;
    case "semaphore":
      return <SemaphoreTool />;
    case "persuasion":
      return <PersuasionTool />;
    case "emoji":
      return <EmojiTool />;
    case "timeline":
      return <TimelineTool />;
    case "password":
      return <PasswordTool />;
    case "fact-opinion":
      return <FactOpinionTool />;
    case "leaf-guide":
      return <LeafGuideTool />;
    case "timer-10":
      return <TimerTool minutes={10} />;
    case "timer-2":
      return <TimerTool minutes={2} />;
  }
}
