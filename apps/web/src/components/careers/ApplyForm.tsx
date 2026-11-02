"use client";

/**
 * Application form for an opening on /careers.
 *
 * Uploads the CV (if any) to Supabase Storage, then inserts the application
 * row. Both go through the public key, which can write but never read.
 */
import { useState } from "react";
import {
  CAREERS_SUPABASE_KEY,
  CAREERS_SUPABASE_URL,
  CV_BUCKET,
  CV_MAX_BYTES,
  CV_TYPES,
} from "@/lib/careers";

const field =
  "mt-1.5 block w-full rounded-xl border border-black/15 bg-white/70 px-4 py-3 text-[15px] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/15 dark:bg-white/5";
const label = "block text-sm font-medium";
const hint = "font-normal text-black/50 dark:text-white/50";

const headers = {
  apikey: CAREERS_SUPABASE_KEY,
  Authorization: `Bearer ${CAREERS_SUPABASE_KEY}`,
};

async function uploadCv(file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${crypto.randomUUID()}/${safeName}`;
  const res = await fetch(`${CAREERS_SUPABASE_URL}/storage/v1/object/${CV_BUCKET}/${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`CV upload failed (${res.status})`);
  return path;
}

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export default function ApplyForm({ role }: { role: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const cv = data.get("cv");
    const file = cv instanceof File && cv.size > 0 ? cv : null;
    const cvLink = get("cvLink");

    if (file && file.size > CV_MAX_BYTES) {
      setStatus({ kind: "error", message: "CV must be 5 MB or smaller." });
      return;
    }
    if (file && !CV_TYPES.includes(file.type)) {
      setStatus({ kind: "error", message: "Please upload your CV as a PDF or Word file." });
      return;
    }
    if (!file && !cvLink) {
      setStatus({ kind: "error", message: "Please upload your CV or paste a link to it." });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const cvPath = file ? await uploadCv(file) : null;
      const res = await fetch(`${CAREERS_SUPABASE_URL}/rest/v1/careers_applications`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          role,
          name: get("name"),
          phone: get("phone"),
          email: get("email"),
          sslc_marks: get("sslc"),
          degree: get("degree"),
          has_backlogs: get("backlogs") === "yes",
          cv_path: cvPath,
          cv_link: cvLink || null,
          note: get("note") || null,
        }),
      });
      if (!res.ok) throw new Error(`Submit failed (${res.status})`);
      form.reset();
      setStatus({ kind: "sent" });
    } catch {
      setStatus({
        kind: "error",
        message: "Something went wrong sending your application. Please try again.",
      });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="rounded-[1.75rem] border border-emerald-500/30 bg-emerald-500/10 p-8 sm:p-10">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Application received. Thank you!
        </p>
        <p lang="ml" className="mt-3 text-lg text-black/70 dark:text-white/70">
          നിങ്ങളുടെ അപേക്ഷ ലഭിച്ചു. ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടുന്നതാണ്.
        </p>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(99,102,241,0.08),transparent_60%)] p-6 sm:grid-cols-2 sm:p-10 dark:border-white/10"
    >
      <label className={label}>
        Full name <span className={hint}>· പേര്</span>
        <input name="name" required maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className={label}>
        Phone / WhatsApp <span className={hint}>· ഫോൺ</span>
        <input name="phone" required type="tel" minLength={6} maxLength={20} autoComplete="tel" className={field} />
      </label>
      <label className={label}>
        Email
        <input name="email" required type="email" maxLength={200} autoComplete="email" className={field} />
      </label>
      <label className={label}>
        SSLC marks <span className={hint}>· e.g. 500 or Full A+</span>
        <input name="sslc" required maxLength={60} className={field} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Engineering degree <span className={hint}>· branch, college, year</span>
        <input name="degree" required maxLength={200} className={field} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className={label}>
          Any backlogs (supply)? <span className={hint}>· സപ്ലി ഉണ്ടോ?</span>
        </legend>
        <div className="mt-2 flex gap-6 text-[15px]">
          <label className="flex items-center gap-2">
            <input type="radio" name="backlogs" value="no" required defaultChecked className="accent-indigo-600" /> No
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="backlogs" value="yes" className="accent-indigo-600" /> Yes
          </label>
        </div>
      </fieldset>
      <label className={label}>
        Upload CV <span className={hint}>· PDF or Word, up to 5 MB</span>
        <input
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
        />
      </label>
      <label className={label}>
        Or a link to your CV <span className={hint}>· Google Drive, LinkedIn</span>
        <input name="cvLink" type="url" maxLength={500} placeholder="https://" className={field} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Why you? <span className={hint}>· optional, a few lines</span>
        <textarea name="note" rows={4} maxLength={2000} className={field} />
      </label>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-13 items-center gap-2 rounded-full bg-black px-8 text-sm font-semibold text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.6)] transition hover:bg-indigo-700 disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {sending ? "Sending…" : "Submit application"}
        </button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
