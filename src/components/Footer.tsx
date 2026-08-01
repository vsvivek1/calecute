import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-black/60 dark:text-white/60 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} Calecute Technologies LLC. All
          rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/data-deletion" className="hover:underline">
            Data Deletion
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
