import Link from "next/link";
import { signOut } from "../actions";
import { isAdmin, isLead, type Officer } from "../session";
import NavLinks from "./NavLinks";

/** Top bar and navigation for every signed-in office page. */
export default function Shell({
  officer,
  logo,
  children,
}: {
  officer: Officer;
  logo: string | null;
  children: React.ReactNode;
}) {
  const links = [
    { href: "/office", label: isLead(officer) ? "Overview" : "My tasks" },
    ...(isLead(officer)
      ? [
          { href: "/office/tasks", label: "Schedule" },
          { href: "/office/tasks/new", label: "Assign" },
        ]
      : []),
    ...(isAdmin(officer)
      ? [
          { href: "/office/people", label: "People" },
          { href: "/office/settings", label: "Settings" },
        ]
      : []),
    { href: "/office/account", label: "Account" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07070c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/office" className="flex min-w-0 items-center gap-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
              <img src={logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold">
                {officer.settings.company_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate font-semibold">{officer.settings.company_name}</span>
            <span className="hidden text-white/40 sm:inline">Office</span>
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-white/60 md:inline">{officer.person.full_name}</span>
            <form action={signOut}>
              <button type="submit" className="btn-ghost text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <NavLinks links={links} />
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
    </div>
  );
}
