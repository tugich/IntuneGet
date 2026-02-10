import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/sections/Footer";

export const metadata: Metadata = {
  title: "Page Not Found | IntuneGet",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deepest flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 pt-24 lg:pt-28">
        <div className="text-center max-w-lg">
          <p className="font-mono text-sm text-accent-cyan mb-4">404</p>
          <h1 className="text-3xl font-bold text-text-primary sm:text-4xl mb-4">
            Page Not Found
          </h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
            The page you are looking for does not exist or has been moved. Try
            one of the links below to get back on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold text-white bg-accent-cyan rounded-xl hover:bg-accent-cyan-dim transition-all"
            >
              Back to Home
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-all"
            >
              Documentation
            </Link>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-all"
            >
              Getting Started
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
