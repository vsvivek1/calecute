"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FILES_BUCKET, FILE_MAX_BYTES } from "../config";
import { browserClient } from "../supabase/browser";
import type { ActionState } from "../types";

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
}

/**
 * Uploads straight from the browser to the private storage bucket (the
 * database's storage rules decide whether this person may), then calls a
 * Server Action to record it. Used for task files and the company logo.
 */
export default function Uploader({
  folder,
  accept,
  label,
  onUploaded,
}: {
  folder: string;
  accept?: string;
  label: string;
  onUploaded: (file: { path: string; name: string; size: number; mime: string }) => Promise<ActionState>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > FILE_MAX_BYTES) {
      setError("That file is over 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const path = `${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: upError } = await browserClient()
        .storage.from(FILES_BUCKET)
        .upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (upError) {
        setError(/row-level|unauthor|403/i.test(upError.message) ? "You don't have permission to upload here." : upError.message);
        return;
      }
      const result = await onUploaded({ path, name: file.name, size: file.size, mime: file.type });
      if (result.error) setError(result.error);
      router.refresh();
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <label className="btn-ghost w-fit cursor-pointer">
        {busy ? "Uploading…" : label}
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
