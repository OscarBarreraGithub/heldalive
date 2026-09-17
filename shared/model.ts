import config from "./model-config.json";
import type { ChatMessage } from "./protocol";
export const CURRENT_MODEL = config;
export function modelPrompt(messages: ChatMessage[]) {
  return (
    messages
      .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`)
      .join("") +
    "<|im_start|>assistant\n" +
    config.chatSuffix
  );
}
