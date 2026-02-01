"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Quote, ExternalLink, TrendingUp } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company?: string;
  companyLogo?: string;
  authorImage?: string;
  metric?: string;
  linkedinUrl?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  companyLogo,
  authorImage,
  metric,
  linkedinUrl,
  className = "",
}: TestimonialCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative flex flex-col p-6 md:p-8 rounded-2xl h-full",
        "bg-white border border-stone-200/60",
        "shadow-card hover:shadow-card-hover",
        "transition-all duration-300",
        className
      )}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              transition: { duration: 0.3, ease: "easeOut" },
            }
      }
    >
      {/* Quote icon */}
      <div className="mb-4">
        <Quote className="w-8 h-8 text-accent-cyan/30" />
      </div>

      {/* Metric highlight if provided */}
      {metric && (
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/5 border border-accent-cyan/20 rounded-full w-fit">
          <TrendingUp className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-sm font-semibold text-accent-cyan">{metric}</span>
        </div>
      )}

      {/* Quote text */}
      <blockquote className="flex-1 mb-6">
        <p className="text-stone-700 text-lg leading-relaxed">
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>

      {/* Author info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {authorImage ? (
          <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={authorImage}
              alt={author}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center">
            <span className="text-lg font-semibold text-stone-600">
              {author.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-stone-900">{author}</p>
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-accent-cyan transition-colors"
                aria-label={`${author}'s LinkedIn profile`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <p className="text-sm text-stone-500">
            {role}
            {company && <span>, {company}</span>}
          </p>
        </div>

        {/* Company logo if provided */}
        {companyLogo && (
          <div className="hidden sm:flex w-16 h-8 items-center justify-end opacity-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogo}
              alt={company || "Company logo"}
              className="max-w-full max-h-full object-contain grayscale"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
