'use client';

import { useState } from 'react';

export default function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="copy">
      <code>{link}</code>{' '}
      <button
        className="btn btn-ghost btn-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </p>
  );
}
