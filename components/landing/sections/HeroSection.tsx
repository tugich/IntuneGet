"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Github, ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/Badge";
import { GradientOrb } from "../ui/GradientOrb";
import { GridBackground } from "../ui/GridBackground";
import { FadeIn } from "../animations/FadeIn";
import { ProductShowcase } from "../ui/ProductShowcase";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative w-full h-screen min-h-[600px] flex flex-col overflow-hidden">
      {/* Background layers */}
      <GridBackground variant="dots" opacity={0.3} className="absolute inset-0" />

      {/* Subtle gradient orbs */}
      <GradientOrb
        color="cyan"
        size="xl"
        className="left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2"
        intensity="low"
      />
      <GradientOrb
        color="violet"
        size="lg"
        className="right-1/4 bottom-1/3 translate-x-1/2"
        intensity="low"
        animate={!shouldReduceMotion}
      />

      {/* Main content - centered vertically */}
      <div className="container relative flex-1 flex flex-col items-center justify-center px-4 md:px-6 mx-auto max-w-7xl pt-20 pb-6">
        {/* Text content */}
        <div className="flex flex-col items-center space-y-4 md:space-y-5 text-center">
          {/* Free & Open Source Badge */}
          <FadeIn animateOnMount duration={0.4}>
            <Badge
              icon={<Github className="h-4 w-4" />}
              variant="dark"
            >
              100% Free & Open Source
            </Badge>
          </FadeIn>

          {/* Trust signals */}
          <FadeIn delay={0.05} animateOnMount duration={0.4}>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-8 text-sm md:text-base text-stone-500">
              <span>Trusted by <strong className="text-stone-900 font-bold">1,000+</strong> IT teams</span>
              <span className="hidden sm:block w-px h-5 bg-stone-300" />
              <span><strong className="text-stone-900 font-bold">10,000+</strong> apps deployed</span>
            </div>
          </FadeIn>

          {/* Main Headline */}
          <FadeIn delay={0.1} animateOnMount duration={0.4}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-stone-900 tracking-tight leading-[1.05] max-w-5xl">
              <span className="gradient-text-cyan">10,000 Apps.</span>{" "}
              <span className="text-stone-800">One Click.</span>
              <br className="hidden md:block" />
              <span className="text-stone-500">Zero Scripting.</span>
            </h1>
          </FadeIn>

          {/* Subheadline */}
          <FadeIn delay={0.15} animateOnMount duration={0.4}>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-stone-600 leading-relaxed">
              Save your team <strong className="font-semibold text-stone-800">10+ hours per deployment</strong>.
              Deploy any app from Winget to Intune instantly
              <span className="hidden sm:inline">—no scripting, no packaging, no hassle.</span>
              <span className="sm:hidden">.</span>
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.2} className="w-full max-w-xl pt-2" animateOnMount duration={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary CTA - Accent cyan */}
              <Link
                href="/auth/signin"
                className="group relative inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-accent-cyan rounded-xl hover:bg-accent-cyan-dim transition-all duration-300 shadow-glow-cyan hover:shadow-glow-cyan-lg"
              >
                Deploy Your First App Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              {/* Secondary CTA - Watch Demo */}
              <Link
                href="#demo"
                className="group inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-4 text-base font-medium text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-300 shadow-soft"
              >
                <Play className="h-5 w-5 text-accent-cyan" />
                Watch Demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              No credit card required{" "}
              <span className="text-stone-300 mx-2">|</span>
              Already using IntuneGet?{" "}
              <Link href="/auth/signin" className="text-accent-cyan hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </FadeIn>
        </div>

        {/* Product Screenshot Showcase */}
        <FadeIn delay={0.25} animateOnMount duration={0.4} className="w-full mt-8 md:mt-10">
          <ProductShowcase compact />
        </FadeIn>
      </div>

      {/* Scroll indicator - at the very bottom */}
      <motion.div
        className="absolute bottom-4 left-1/2 hidden md:block"
        style={{ x: "-50%" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <motion.div
          className="w-5 h-8 rounded-full border-2 border-stone-300/60 flex items-start justify-center p-1"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  borderColor: [
                    "rgba(168, 162, 158, 0.6)",
                    "rgba(8, 145, 178, 0.4)",
                    "rgba(168, 162, 158, 0.6)",
                  ],
                }
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 bg-stone-400/60 rounded-full"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, 10, 0],
                    backgroundColor: [
                      "rgba(168, 162, 158, 0.6)",
                      "rgba(8, 145, 178, 0.8)",
                      "rgba(168, 162, 158, 0.6)",
                    ],
                  }
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
