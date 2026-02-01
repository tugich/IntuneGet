"use client";

import { FadeIn } from "../animations/FadeIn";
import { StaggerContainer, StaggerItem } from "../animations/StaggerContainer";
import { TestimonialCard } from "../ui/TestimonialCard";
import { GradientOrb } from "../ui/GradientOrb";
import { GridBackground } from "../ui/GridBackground";

const testimonials = [
  {
    quote: "We reduced our app deployment time from 8 hours to just 12 minutes. IntuneGet has completely transformed how we manage our fleet of devices.",
    author: "Michael R.",
    role: "IT Director",
    company: "Regional Healthcare System",
    metric: "Saves 40 hrs/month",
  },
  {
    quote: "As an MSP, time is money. IntuneGet lets us deploy apps across multiple tenants in a fraction of the time. Our clients are happier and we're more profitable.",
    author: "Sarah K.",
    role: "MSP Owner",
    company: "TechServe Solutions",
    metric: "3x faster deployments",
  },
  {
    quote: "Open source and actually works. Rare combination. We've deployed over 500 apps with zero issues. The community support is excellent.",
    author: "David L.",
    role: "Systems Engineer",
    company: "Fortune 500 Tech Company",
    metric: "500+ apps deployed",
  },
  {
    quote: "The zero-scripting approach is a game changer for our team. We no longer need PowerShell experts to deploy applications to our endpoints.",
    author: "Jennifer M.",
    role: "IT Manager",
    company: "Educational Institution",
    metric: "Zero scripts needed",
  },
  {
    quote: "IntuneGet handles version management automatically. No more manually checking for updates or dealing with outdated deployments.",
    author: "Robert T.",
    role: "Senior Systems Admin",
    company: "Financial Services Firm",
    metric: "Auto version updates",
  },
  {
    quote: "We evaluated several commercial solutions before finding IntuneGet. It does everything they do, but better - and it's completely free.",
    author: "Amanda W.",
    role: "CTO",
    company: "Tech Startup",
    metric: "$0 licensing costs",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <GridBackground variant="dots" opacity={0.2} className="absolute inset-0" />

      {/* Gradient orbs */}
      <GradientOrb
        color="violet"
        size="lg"
        className="left-0 top-1/4"
        intensity="low"
      />
      <GradientOrb
        color="cyan"
        size="md"
        className="right-0 bottom-1/4"
        intensity="low"
      />

      <div className="container relative px-4 md:px-6 mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <FadeIn>
            <span className="inline-block font-mono text-xs tracking-wider text-accent-cyan uppercase mb-4">
              Testimonials
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900">
              Loved by IT Teams Worldwide
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto max-w-2xl text-lg text-stone-600">
              See what IT professionals are saying about their experience with IntuneGet
            </p>
          </FadeIn>
        </div>

        {/* Testimonial cards - 2 rows of 3 */}
        <StaggerContainer
          className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3"
          staggerDelay={0.1}
        >
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <TestimonialCard
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                metric={testimonial.metric}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Read more link */}
        <FadeIn delay={0.5}>
          <div className="mt-10 md:mt-12 text-center">
            <a
              href="https://github.com/ugurkocde/IntuneGet/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-cyan hover:text-accent-cyan-dim transition-colors"
            >
              Read more success stories
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
