import type { Metadata } from "next";
import { saveSettings, setLogo } from "@/office/actions";
import ActionForm from "@/office/components/ActionForm";
import LogoUploader from "@/office/components/LogoUploader";
import { logoUrl } from "@/office/data";
import { requireAdmin } from "@/office/session";

export const metadata: Metadata = { title: "Settings" };

async function removeLogo() {
  "use server";
  await setLogo(null);
}

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "UTC"];

export default async function SettingsPage() {
  const officer = await requireAdmin();
  const logo = await logoUrl(officer.settings.logo_path);
  const zones = TIMEZONES.includes(officer.settings.timezone) ? TIMEZONES : [officer.settings.timezone, ...TIMEZONES];

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="h1">Settings</h1>
        <p className="mt-1 muted">Shown at the top of every office page.</p>
      </div>
      <section className="card">
        <ActionForm action={saveSettings} submit="Save" reset={false}>
          <label className="label">
            Company name
            <input name="company_name" required maxLength={120} defaultValue={officer.settings.company_name} className="field" />
          </label>
          <label className="label">
            Timezone (decides when a task becomes overdue)
            <select name="timezone" defaultValue={officer.settings.timezone} className="field">
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </section>
      <section className="card grid gap-3">
        <h2 className="h2">Logo</h2>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
          <img src={logo} alt="Current logo" className="h-20 w-20 rounded-xl bg-white/5 object-contain p-2" />
        ) : (
          <p className="muted">No logo yet. The first letter of the company name is used.</p>
        )}
        <div className="flex flex-wrap items-start gap-3">
          <LogoUploader />
          {logo ? (
            <form action={removeLogo}>
              <button type="submit" className="btn-ghost">
                Remove logo
              </button>
            </form>
          ) : null}
        </div>
        <p className="text-xs text-white/40">PNG, JPG, WebP or SVG. A square image works best.</p>
      </section>
    </div>
  );
}
