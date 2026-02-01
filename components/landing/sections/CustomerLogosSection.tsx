"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "../animations/FadeIn";
import { Building2 } from "lucide-react";

// Placeholder customer logos - these represent enterprise categories
// In production, replace with actual customer logos
const customerCategories = [
  { name: "Healthcare", abbr: "HC" },
  { name: "Finance", abbr: "FIN" },
  { name: "Education", abbr: "EDU" },
  { name: "Government", abbr: "GOV" },
  { name: "Technology", abbr: "TECH" },
  { name: "Manufacturing", abbr: "MFG" },
  { name: "Retail", abbr: "RTL" },
  { name: "Legal", abbr: "LAW" },
  { name: "Media", abbr: "MDA" },
  { name: "Consulting", abbr: "CST" },
  { name: "Non-Profit", abbr: "NPO" },
  { name: "Energy", abbr: "NRG" },
];

export function CustomerLogosSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative w-full py-12 md:py-16 bg-white border-b border-stone-200/60">
      <div className="container relative px-4 md:px-6 mx-auto max-w-6xl">
        {/* Section header */}
        <FadeIn>
          <div className="text-center mb-8 md:mb-10">
            <p className="text-sm text-stone-500 font-medium">
              Trusted by IT teams at leading organizations across industries
            </p>
          </div>
        </FadeIn>

        {/* Customer logos grid */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6 md:gap-8">
            {customerCategories.map((category, index) => (
              <motion.div
                key={category.name}
                className="group flex flex-col items-center justify-center p-4 md:p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: shouldReduceMotion ? 0 : 0.1 + index * 0.03,
                }}
              >
                {/* Logo placeholder */}
                <div className="w-16 h-10 md:w-20 md:h-12 flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 text-stone-400 group-hover:text-accent-cyan transition-colors" />
                    <span className="text-sm md:text-base font-semibold text-stone-400 group-hover:text-stone-700 transition-colors">
                      {category.abbr}
                    </span>
                  </div>
                </div>
                {/* Category name on hover */}
                <span className="mt-1 text-[10px] text-stone-300 group-hover:text-stone-500 transition-colors">
                  {category.name}
                </span>
              </motion.div>
            ))}
          </div>
        </FadeIn>

        {/* Customer count callout */}
        <FadeIn delay={0.2}>
          <div className="mt-8 md:mt-10 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-500">
              Join <span className="font-semibold text-stone-700">1,000+</span> organizations that trust IntuneGet for their app deployments
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
