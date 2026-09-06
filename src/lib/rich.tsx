import type { ReactNode } from "react";

/**
 * Renders `**bold**` spans inside the plain strings held in lib/apps.ts.
 *
 * The disclosures live as data so they cannot drift between apps, but a few of
 * them need one word emphasised — "records are **not** deleted" reads very
 * differently from the same sentence skimmed without it. This keeps that
 * emphasis in the data rather than forcing the string to be split across JSX.
 */
export function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
