"use client";

import { ArrowRight, Github, Star } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "../animations/FadeIn";
import { GradientOrb } from "../ui/GradientOrb";

export function CTASection() {
  return (
    <section
      id="get-started"
      className="relative w-full py-24 md:py-32 overflow-hidden bg-stone-50"
    >
      {/* Gradient orbs */}
      <GradientOrb
        color="cyan"
        size="xl"
        className="left-1/4 bottom-0"
        intensity="low"
      />
      <GradientOrb
        color="violet"
        size="lg"
        className="right-1/4 bottom-1/4"
        intensity="low"
      />

      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />

      <div className="container relative px-4 md:px-6 mx-auto max-w-4xl">
        <div className="text-center space-y-8">
          <FadeIn>
            <span className="inline-block font-mono text-xs tracking-wider text-accent-cyan uppercase mb-4">
              Get Started
            </span>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900">
              Ready to Streamline Your App Deployment?
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Start deploying applications from Winget to Intune in minutes.
              Free forever, no credit card required.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {/* Primary CTA - Accent cyan */}
              <Link
                href="/auth/signin"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-accent-cyan rounded-xl hover:bg-accent-cyan-dim transition-all duration-300 shadow-glow-cyan hover:shadow-glow-cyan-lg"
              >
                Deploy Your First App Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA - GitHub */}
              <a
                href="https://github.com/ugurkocde/IntuneGet"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-300 shadow-soft"
              >
                <Github className="h-5 w-5" />
                Star on GitHub
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-stone-500 pt-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                100% open source
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Free forever
              </span>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
