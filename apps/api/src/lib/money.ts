/**
 * Commission arithmetic, in one place, in integer paise.
 *
 * The published terms are the specification:
 *   - 10% of every payment the referred customer makes
 *   - calculated after GST and payment gateway charges
 *   - TDS 2% under Section 194H, deducted from the commission
 *
 * Rounding is floor at each step, so the agent is never credited a fraction of
 * a paisa that does not exist and the ledger always balances.
 */

export const COMMISSION_RATE_BPS = 1000; // 10%
export const TDS_RATE_BPS = 200; // 2%, Section 194H

export interface CommissionBreakdown {
  basePaise: number;
  rateBps: number;
  grossCommissionPaise: number;
  tdsRateBps: number;
  tdsPaise: number;
  netCommissionPaise: number;
}

export function commissionFor(
  netPaymentPaise: number,
  options: { rateBps?: number; tdsRateBps?: number } = {},
): CommissionBreakdown {
  const rateBps = options.rateBps ?? COMMISSION_RATE_BPS;
  const tdsRateBps = options.tdsRateBps ?? TDS_RATE_BPS;
  const grossCommissionPaise = Math.floor((netPaymentPaise * rateBps) / 10000);
  const tdsPaise = Math.floor((grossCommissionPaise * tdsRateBps) / 10000);
  return {
    basePaise: netPaymentPaise,
    rateBps,
    grossCommissionPaise,
    tdsRateBps,
    tdsPaise,
    netCommissionPaise: grossCommissionPaise - tdsPaise,
  };
}

/** The base a commission is calculated on: gross less GST less gateway fee. */
export function netOfPayment(params: {
  grossPaise: number;
  gstPaise: number;
  gatewayFeePaise: number;
}): number {
  return params.grossPaise - params.gstPaise - params.gatewayFeePaise;
}

/** Indian financial year label for a date: April to March, e.g. "2026-27". */
export function financialYearOf(date: Date): string {
  const year = date.getUTCFullYear();
  // Financial year starts 1 April. Use IST, since that is the filing calendar.
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const startYear = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function rupees(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
