"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Play, Clock, Check } from "lucide-react";
import { FadeIn } from "../animations/FadeIn";
import { GradientOrb } from "../ui/GradientOrb";

const demoTimestamps = [
  { time: "0:00", label: "Dashboard Overview" },
  { time: "0:45", label: "Searching & Selecting Apps" },
  { time: "1:30", label: "One-Click Deployment" },
  { time: "2:15", label: "Monitoring Progress" },
];

export function DemoSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="demo"
      className="relative w-full py-20 md:py-28 bg-stone-50 overflow-hidden"
    >
      {/* Gradient orbs */}
      <GradientOrb
        color="cyan"
        size="lg"
        className="left-0 top-0"
        intensity="low"
      />
      <GradientOrb
        color="violet"
        size="md"
        className="right-0 bottom-0"
        intensity="low"
      />

      <div className="container relative px-4 md:px-6 mx-auto max-w-6xl">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14 space-y-4">
          <FadeIn>
            <span className="inline-block font-mono text-xs tracking-wider text-accent-cyan uppercase mb-4">
              Product Demo
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900">
              See IntuneGet in Action
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto max-w-2xl text-lg text-stone-600">
              Watch how easy it is to deploy applications from Winget to Intune in just a few clicks
            </p>
          </FadeIn>
        </div>

        {/* Video player placeholder */}
        <FadeIn delay={0.3}>
          <motion.div
            className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden shadow-soft-xl cursor-pointer group"
            whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
            transition={{ duration: 0.3 }}
          >
            {/* Video thumbnail placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
              </div>

              {/* Product mockup hint */}
              <div className="absolute inset-8 md:inset-16 border border-white/10 rounded-xl flex items-center justify-center">
                <div className="text-center text-white/30">
                  <div className="text-4xl md:text-6xl font-bold mb-2">IntuneGet</div>
                  <div className="text-sm md:text-base">Demo Video Coming Soon</div>
                </div>
              </div>

              {/* Play button */}
              <motion.div
                className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-accent-cyan group-hover:border-accent-cyan transition-all duration-300"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
              >
                <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
              </motion.div>
            </div>

            {/* Duration badge */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/80" />
              <span className="text-sm text-white/80 font-medium">2:45</span>
            </div>
          </motion.div>
        </FadeIn>

        {/* Video chapters/timestamps */}
        <FadeIn delay={0.4}>
          <div className="mt-8 md:mt-10">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4 text-center">
              What you&apos;ll learn
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoTimestamps.map((item, index) => (
                <motion.div
                  key={item.time}
                  className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-xl border border-stone-200 hover:border-accent-cyan/30 hover:shadow-soft transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.3,
                    delay: shouldReduceMotion ? 0 : 0.4 + index * 0.1,
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-stone-400 font-mono">{item.time}</div>
                    <div className="text-sm font-medium text-stone-700 truncate">{item.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
