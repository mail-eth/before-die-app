"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "@/lib/content";

type Copy = {
  formName: string;
  formDream: string;
  formReason: string;
  formLanguage: string;
  formPublicNote: string;
  formSubmit: string;
  formLoading: string;
  formSuccess: string;
  formError: string;
  formPlaceholderName: string;
  formPlaceholderDream: string;
  formPlaceholderReason: string;
  languageLabel: { id: string; en: string };
};

type PrivacyMode = "name" | "emoji" | "anonymous";

export function SubmitForm({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [privacy, setPrivacy] = useState<PrivacyMode>("anonymous");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setStatus("idle");

    let name = "";
    if (privacy === "anonymous") {
      name = "anonymous";
    } else if (privacy === "emoji") {
      name = formData.get("emoji") as string || "🙈";
    } else {
      name = formData.get("name") as string || "";
    }

    const payload = {
      name,
      dream: formData.get("dream") as string || "",
      reason: formData.get("reason") as string || "",
      language: formData.get("language") as string || locale,
      website: formData.get("website") as string || "",
    };

    try {
      const res = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setStatus(data.ok ? "success" : "error");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage(copy.formError);
    } finally {
      setPending(false);
    }
  }

  const successMessage = copy.formSuccess || "Mimpi mu sudah masuk. Terima kasih sudah berbagi.";

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-accent/30 bg-accent/5 p-10 text-center"
        >
          <motion.p
            className="text-lg font-medium text-foreground"
          >
            {successMessage.split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.4 }}
                style={{ display: "inline-block", marginRight: "0.25em" }}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-4 h-px w-24 origin-center bg-accent/40"
          />
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            onClick={() => { setStatus("idle"); setMessage(null); }}
            className="mt-6 text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
          >
            ← Submit another
          </motion.button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={onSubmit as unknown as string}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur"
        >
          {/* Privacy Selector */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground/80">
              🫣 {copy.formName}
            </label>
            <div className="flex gap-2">
              {(["anonymous", "emoji", "name"] as PrivacyMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPrivacy(mode)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    privacy === mode
                      ? mode === "anonymous"
                        ? "bg-[#C4A882] text-white"
                        : mode === "emoji"
                        ? "bg-[#8FAF9A] text-white"
                        : "bg-foreground text-background"
                      : "bg-card border border-border/60 text-muted-foreground hover:border-border"
                  }`}
                >
                  {mode === "anonymous" && "🔒 Anonymous"}
                  {mode === "emoji" && "🙈 Emoji"}
                  {mode === "name" && "✏️ Name"}
                </button>
              ))}
            </div>
          </div>

          {/* Name field */}
          {privacy === "name" && (
            <div className="mb-5 space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                {copy.formName}
              </label>
              <input
                name="name"
                required={privacy === "name"}
                minLength={2}
                maxLength={40}
                placeholder={copy.formPlaceholderName}
                className="w-full rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}

          {/* Emoji field */}
          {privacy === "emoji" && (
            <div className="mb-5 space-y-2">
              <label className="text-sm font-medium text-foreground/80">
                Pilih emoji kamu
              </label>
              <input
                name="emoji"
                required={privacy === "emoji"}
                maxLength={10}
                placeholder="🙈"
                className="w-full rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-2xl text-center outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}

          {/* Dream */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              {copy.formDream}
            </label>
            <textarea
              name="dream"
              required
              minLength={10}
              maxLength={140}
              rows={3}
              placeholder={copy.formPlaceholderDream}
              className="w-full resize-none rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* Reason */}
          <div className="mt-5 space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              {copy.formReason}
            </label>
            <textarea
              name="reason"
              required
              minLength={20}
              maxLength={500}
              rows={4}
              placeholder={copy.formPlaceholderReason}
              className="w-full resize-none rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* Language */}
          <div className="mt-5 space-y-2">
            <label className="text-sm font-medium text-foreground/80">
              {copy.formLanguage}
            </label>
            <select
              name="language"
              defaultValue={locale}
              className="w-full rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
            >
              <option value="id">{copy.languageLabel.id}</option>
              <option value="en">{copy.languageLabel.en}</option>
            </select>
          </div>

          {/* Honeypot */}
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {/* Privacy note */}
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground/60 italic">
            🔒 {copy.formPublicNote}
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-xl bg-foreground py-3.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
                {copy.formLoading}
              </span>
            ) : (
              copy.formSubmit
            )}
          </button>

          {/* Error message */}
          {message && status === "error" && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {message}
            </div>
          )}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
