"use client";

import { useState } from "react";
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

export function SubmitForm({ locale, copy }: { locale: Locale; copy: Copy }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setStatus("idle");

    const payload = {
      name: String(formData.get("name") || ""),
      dream: String(formData.get("dream") || ""),
      reason: String(formData.get("reason") || ""),
      language: String(formData.get("language") || locale),
      website: String(formData.get("website") || ""),
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

  return (
    <form
      action={onSubmit}
      className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur"
    >
      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">
          {copy.formName}
        </label>
        <input
          name="name"
          required
          minLength={2}
          maxLength={40}
          placeholder={copy.formPlaceholderName}
          className="w-full rounded-xl border border-border/70 bg-input-bg px-4 py-3 text-sm text-foreground placeholder-muted-foreground/60 outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {/* Dream */}
      <div className="mt-5 space-y-2">
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

      {/* Honeypot — hidden from humans */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Privacy note */}
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground/60 italic">
        {copy.formPublicNote}
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

      {/* Feedback */}
      {message ? (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            status === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
