// Generators. The OpenAI generator is used at build time (needs OPENAI_API_KEY);
// the mock generator lets the curation loop run offline for dry-runs and tests.
import type { Generate } from "./curate";

/** Offline generator — deterministic, no network. */
export const mockGenerator: Generate = async (item, attempt) => ({
  text:
    attempt === 1
      ? `Picture "${item.answer}" when you see ${item.prompt}` +
        (item.reading ? ` (${item.reading}).` : ".")
      : `Alternative #${attempt}: a vivid scene linking ${item.prompt} to "${item.answer}".`,
  memeImageUrl: undefined,
});

/**
 * OpenAI-backed generator: a text mnemonic (chat) + a meme image (images).
 * `openai` is imported dynamically so the package works offline without it.
 */
export function openAiGenerator(opts?: {
  textModel?: string;
  imageModel?: string;
}): Generate {
  const textModel = opts?.textModel ?? "gpt-4o-mini";
  const imageModel = opts?.imageModel ?? "gpt-image-1";

  return async (item, attempt) => {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI(); // reads OPENAI_API_KEY from env

    const chat = await client.chat.completions.create({
      model: textModel,
      temperature: attempt === 1 ? 0.7 : 1.0, // more variety on regenerate
      messages: [
        {
          role: "system",
          content:
            "You write short, vivid, memorable mnemonics for language learners. " +
            "One or two sentences. No preamble.",
        },
        {
          role: "user",
          content:
            `Create a mnemonic to remember that the Chinese ${item.kind} "${item.prompt}"` +
            `${item.reading ? ` (${item.reading})` : ""} means "${item.answer}".`,
        },
      ],
    });
    const text = chat.choices[0]?.message?.content?.trim() ?? "";

    const image = await client.images.generate({
      model: imageModel,
      prompt: `A simple, funny meme illustrating the mnemonic: ${text}. Clean, bold, memorable.`,
      size: "1024x1024",
      n: 1,
    });
    const memeImageUrl = image.data?.[0]?.url;

    return { text, memeImageUrl };
  };
}
