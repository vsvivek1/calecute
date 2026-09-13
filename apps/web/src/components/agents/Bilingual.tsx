/**
 * Kept only for the placeholder marker.
 *
 * This file used to hold the Bi/Ml/En components that rendered every string
 * twice, Malayalam over English. The site is single-language now, so plain
 * text replaced all of them.
 */

/**
 * Renders an unsupplied value visibly.
 *
 * The brief says not to invent a CIN, a product name or an address, and to
 * leave clearly marked placeholders instead. A placeholder that renders as an
 * obvious red-dashed token cannot be shipped by accident; one that renders as
 * empty space can.
 */
export function Placeholder({ value }: { value: string }) {
  return (
    <span className="placeholder-flag" title="Not yet supplied — see README">
      {value}
    </span>
  );
}
