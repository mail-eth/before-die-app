import { z } from "zod";

export const dreamSchema = z.object({
  name: z.string().trim().min(2).max(40),
  dream: z.string().trim().min(10).max(140),
  reason: z.string().trim().min(20).max(500),
  language: z.enum(["id", "en"]),
  website: z.string().optional().default(""),
});

const bannedLink = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|me|co|id|gg|ly))/i;
const heavySpam = /(free money|klik link|click link|promo|casino|slot|judi|xxx)/i;

export function moderateSubmission(input: z.infer<typeof dreamSchema>) {
  const normalized = {
    ...input,
    name: input.name.replace(/\s+/g, " ").trim(),
    dream: input.dream.replace(/\s+/g, " ").trim(),
    reason: input.reason.replace(/\s+/g, " ").trim(),
  };

  if (normalized.website) {
    return { status: "rejected" as const, message: "Bot detected." };
  }

  const joined = `${normalized.name} ${normalized.dream} ${normalized.reason}`;

  if (bannedLink.test(joined) || heavySpam.test(joined)) {
    return {
      status: "rejected" as const,
      message: "Your submission could not be published right now.",
    };
  }

  return {
    status: "published" as const,
    message: "Your dream has been received.",
    value: normalized,
  };
}
