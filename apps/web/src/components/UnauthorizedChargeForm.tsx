"use client";

/**
 * Report form for the unauthorized transactions page.
 *
 * The site has no mail backend, so the form builds a prefilled email and
 * hands it to the user's mail app. That keeps the report in our inbox with a
 * reply-to the customer can actually read, and needs no server secrets.
 */
import { useState } from "react";
import { company } from "@/lib/company";

const APPS = [
  "Recallio: USS Kerala Exam Prep",
  "Recallio: LSS Kerala Exam Prep",
  "Recallio: Plus One Science",
  "Recallio: Plus Two Science",
  "Find My Bus",
  "DailyDo",
];

const field =
  "mt-1 block w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20";
const label = "block text-sm font-medium";

export default function UnauthorizedChargeForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const body = [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `App: ${get("app")}`,
      `Transaction date: ${get("date")}`,
      `Amount: ${get("amount")}`,
      `Order / transaction ID: ${get("orderId") || "not provided"}`,
      `Last 4 digits of card / UPI ID: ${get("payment") || "not provided"}`,
      "",
      "What happened:",
      get("details"),
    ].join("\n");

    const subject = `Unauthorized transaction report: ${get("app")}`;
    window.location.href = `mailto:${company.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Full name
          <input name="name" required className={field} autoComplete="name" />
        </label>
        <label className={label}>
          Email
          <input
            name="email"
            type="email"
            required
            className={field}
            autoComplete="email"
          />
        </label>
      </div>

      <label className={label}>
        App
        <input name="app" required list="calecutech-apps" className={field} />
        <datalist id="calecutech-apps">
          {APPS.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Transaction date
          <input name="date" type="date" required className={field} />
        </label>
        <label className={label}>
          Amount charged
          <input
            name="amount"
            required
            placeholder="e.g. ₹199"
            className={field}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Order or transaction ID (optional)
          <input name="orderId" className={field} />
        </label>
        <label className={label}>
          Last 4 card digits or UPI ID (optional)
          <input name="payment" className={field} />
        </label>
      </div>

      <label className={label}>
        What happened
        <textarea
          name="details"
          required
          rows={5}
          placeholder="Tell us why you believe this charge was not authorised."
          className={field}
        />
      </label>

      <p className="text-xs text-black/50 dark:text-white/50">
        Never send your full card number, CVV, PIN or OTP. We will never ask
        for them.
      </p>

      <button
        type="submit"
        className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Send report
      </button>

      {sent && (
        <p role="status" className="text-sm text-black/70 dark:text-white/70">
          Your email app should now open with the report filled in. Press send
          there. If nothing opened, email{" "}
          <a className="underline" href={`mailto:${company.email}`}>
            {company.email}
          </a>{" "}
          with the same details.
        </p>
      )}
    </form>
  );
}
