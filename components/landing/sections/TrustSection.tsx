"use client";

import { Shield, Lock, Github, Monitor, Building2, Clock, ChevronDown } from "lucide-react";
import { FadeIn } from "../animations/FadeIn";
import { CountUp } from "../animations/CountUp";
import { LogoBar } from "../ui/LogoBar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const worksWithLogos = [
  { name: "Microsoft Intune", src: "/icons/Microsoft.Intune/icon-64.png", alt: "Microsoft Intune" },
  { name: "Entra ID", src: "/icons/Microsoft.EntraID/icon-64.png", alt: "Entra ID" },
  { name: "Winget", src: "/icons/Microsoft.Winget/icon-64.png", alt: "Winget" },
];

const connectsToLogos = [
  { name: "Slack", src: "/icons/SlackTechnologies.Slack/icon-64.png", alt: "Slack" },
  { name: "Teams", src: "/icons/Microsoft.Teams/icon-64.png", alt: "Microsoft Teams" },
  { name: "Discord", src: "/icons/Discord.Discord/icon-64.png", alt: "Discord" },
];

const metrics = [
  { value: 10000, suffix: "+", label: "Apps Available" },
  { value: 1000, suffix: "+", label: "IT Teams" },
  { value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
];

const securityBadges = [
  { icon: Lock, label: "Your credentials never leave your environment", color: "emerald" },
  { icon: Shield, label: "Enterprise-grade security", color: "cyan" },
  { icon: Github, label: "100% Open Source - MIT License", color: "stone" },
];

export function TrustSection() {
  const [showIntegrations, setShowIntegrations] = useState(false);

  return (
    <section className="relative w-full py-16 md:py-20 bg-white border-y border-stone-200/60">
      <div className="container relative px-4 md:px-6 mx-auto max-w-6xl">
        {/* Quantified headline */}
        <FadeIn>
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900 mb-3">
              Trusted by <span className="gradient-text-cyan">1,000+</span> IT Organizations
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              From startups to enterprises, teams rely on IntuneGet to streamline their app deployments
            </p>
          </div>
        </FadeIn>

        {/* Key metrics */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-3 gap-6 md:gap-12 mb-10 md:mb-12 pb-10 md:pb-12 border-b border-stone-200/60">
            {metrics.map((metric, index) => (
              <div key={metric.label} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-1">
                  <CountUp
                    end={metric.value}
                    suffix={metric.suffix}
                    decimals={metric.decimals || 0}
                    delay={0.2 + index * 0.1}
                  />
                </div>
                <div className="text-xs sm:text-sm text-stone-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Security & trust badges */}
        <FadeIn delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-10 md:mb-12">
            {securityBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 border border-stone-200"
              >
                <badge.icon
                  className={`w-4 h-4 ${
                    badge.color === "emerald"
                      ? "text-emerald-600"
                      : badge.color === "cyan"
                      ? "text-accent-cyan"
                      : "text-stone-700"
                  }`}
                />
                <span className="text-sm font-medium text-stone-600">{badge.label}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Integrations disclosure */}
        <FadeIn delay={0.3}>
          <div className="border-t border-stone-200/60 pt-8 md:pt-10">
            <button
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="flex items-center gap-2 mx-auto text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <span>View integrations</span>
              <motion.div
                animate={{ rotate: showIntegrations ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showIntegrations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-8 md:mt-10">
                    <LogoBar title="Works With" logos={worksWithLogos} />
                    <LogoBar title="Connects To" logos={connectsToLogos} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
