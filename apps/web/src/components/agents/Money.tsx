/**
 * Rupee formatting.
 *
 * Every money value in the API is integer paise, so all conversion happens in
 * one place. Indian digit grouping (1,00,000 not 100,000) via the en-IN locale,
 * because a lakh written the international way reads wrong to the audience.
 */
export function formatRupees(paise: number | null | undefined): string {
  const value = (paise ?? 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function Rupees({ paise }: { paise: number | null | undefined }) {
  return <span lang="en">{formatRupees(paise)}</span>;
}
