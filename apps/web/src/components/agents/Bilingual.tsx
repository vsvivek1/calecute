/**
 * Malayalam primary, English secondary.
 *
 * Every piece of user-facing copy on these pages goes through here, which makes
 * the rule structural rather than a convention someone has to remember.
 *
 * There is no language toggle, by design. A visitor arriving from a WhatsApp
 * forward should not have to make a choice before they can read anything, and
 * rendering both is itself a signal about who the page is for.
 *
 * `lang` is set per run so a screen reader switches voice rather than reading
 * English with Malayalam phonetics.
 */
import type { ReactNode } from "react";

export interface BilingualText {
  ml: string;
  en: string;
}

export function Bi({
  text,
  as: Tag = "p",
  className,
}: {
  text: BilingualText;
  as?: "p" | "div" | "h1" | "h2" | "h3" | "li" | "span";
  className?: string;
}) {
  return (
    <Tag className={className ? `bi ${className}` : "bi"}>
      <span className="ml" lang="ml">
        {text.ml}
      </span>
      <span className="en" lang="en">
        {text.en}
      </span>
    </Tag>
  );
}

/** Malayalam only, for a run with no English counterpart. */
export function Ml({ children }: { children: ReactNode }) {
  return (
    <span className="ml" lang="ml">
      {children}
    </span>
  );
}

/** English only, styled as the secondary gloss. */
export function En({ children }: { children: ReactNode }) {
  return (
    <span className="en" lang="en">
      {children}
    </span>
  );
}

/**
 * Renders a placeholder value visibly.
 *
 * The brief says not to invent a CIN, a product name or a contact number, and
 * to leave clearly marked placeholders instead. A placeholder that renders as an
 * obvious red-dashed token cannot be shipped by accident; one that renders as
 * empty space can.
 */
export function Placeholder({ value }: { value: string }) {
  return (
    <span className="placeholder-flag" lang="en" title="Not yet supplied — see README">
      {value}
    </span>
  );
}
