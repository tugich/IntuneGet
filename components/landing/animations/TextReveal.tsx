"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  once?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** If true, animate on mount instead of on scroll into view */
  animateOnMount?: boolean;
}

export function TextReveal({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.03,
  once = true,
  as: Component = "span",
  animateOnMount = false,
}: TextRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const lines = text.split("\n").map((line) => line.split(" "));

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
      filter: shouldReduceMotion ? "blur(0px)" : "blur(4px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const MotionComponent = motion[Component];

  const motionProps = animateOnMount
    ? { initial: "hidden" as const, animate: "visible" as const }
    : { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once, amount: 0.5 } };

  return (
    <MotionComponent
      className={className}
      {...motionProps}
      variants={containerVariants}
      aria-label={text}
    >
      {lines.map((words, lineIndex) => (
        <span key={`line-${lineIndex}`} className={lineIndex < lines.length - 1 ? "block" : undefined}>
          {words.map((word, wordIndex) => (
            <motion.span
              key={`${word}-${lineIndex}-${wordIndex}`}
              className="inline-block"
              variants={wordVariants}
            >
              {word}
              {wordIndex < words.length - 1 && "\u00A0"}
            </motion.span>
          ))}
        </span>
      ))}
    </MotionComponent>
  );
}
