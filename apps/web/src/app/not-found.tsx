import Link from "next/link";

export const metadata = {
  title: "Page not found | Calecutech",
  description: "The page you were looking for could not be found.",
};

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center text-black dark:bg-black dark:text-white">
        <p className="text-sm uppercase tracking-widest text-black/60 dark:text-white/60">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="max-w-md text-black/70 dark:text-white/70">
          The page you were looking for does not exist or has moved.
        </p>
        <Link href="/" className="mt-2 underline underline-offset-2">
          Return to the Calecutech home page
        </Link>
      </body>
    </html>
  );
}
