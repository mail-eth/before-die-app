import { z } from "zod";

export const dreamSchema = z.object({
  name: z.string().trim().min(2).max(40),
  dream: z.string().trim().min(10).max(140),
  reason: z.string().trim().min(20).max(500),
  language: z.enum(["id", "en"]),
  website: z.string().optional().default(""),
});

// Strip all HTML tags and control characters
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

const bannedLink = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|me|co|id|gg|ly))/i;
const heavySpam = /(free money|klik link|click link|promo|casino|slot|judi|xxx)/i;

export function moderateSubmission(input: z.infer<typeof dreamSchema>) {
  // Honeypot check
  if (input.website) {
    return { status: "rejected" as const, message: "Bot detected." };
  }

  // Sanitize all text fields
  const sanitized = {
    name: sanitize(input.name),
    dream: sanitize(input.dream),
    reason: sanitize(input.reason),
    language: input.language,
  };

  // Basic anti-spam: no links
  const joined = `${sanitized.name} ${sanitized.dream} ${sanitized.reason}`;
  if (bannedLink.test(joined) || heavySpam.test(joined)) {
    return {
      status: "rejected" as const,
      message: "Your submission could not be published right now.",
    };
  }

  return {
    status: "published" as const,
    message: "Your dream has been received.",
    value: sanitized,
  };
}
