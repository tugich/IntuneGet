'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Upload, Wand2, ClipboardCheck, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Import', icon: Upload },
  { id: 2, label: 'Match', icon: Wand2 },
  { id: 3, label: 'Review', icon: ClipboardCheck },
  { id: 4, label: 'Migrate', icon: Play },
] as const;

interface SccmMigrationStepperProps {
  currentStep: 1 | 2 | 3 | 4;
  migrationId?: string;
}

export function SccmMigrationStepper({ currentStep, migrationId }: SccmMigrationStepperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isPending = step.id > currentStep;
        const StepIcon = step.icon;

        const stepContent = (
          <div className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={prefersReducedMotion ? {} : { scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
                  isCompleted && 'bg-status-success/20 border-2 border-status-success',
                  isCurrent && 'bg-accent-cyan/20 border-2 border-accent-cyan',
                  isPending && 'bg-bg-elevated border-2 border-overlay/10'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-status-success" />
                ) : (
                  <StepIcon className={cn(
                    'w-4 h-4',
                    isCurrent ? 'text-accent-cyan' : 'text-text-muted'
                  )} />
                )}
              </motion.div>
              <span className={cn(
                'mt-1.5 text-xs font-medium',
                isCompleted && 'text-status-success',
                isCurrent && 'text-accent-cyan',
                isPending && 'text-text-muted'
              )}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="w-12 sm:w-20 h-0.5 mx-1.5 mt-[-16px] overflow-hidden rounded-full bg-overlay/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
                  className="h-full bg-status-success/50"
                />
              </div>
            )}
          </div>
        );

        // Completed steps link to their respective pages
        if (isCompleted && migrationId) {
          const href = step.id === 1
            ? '/dashboard/sccm/new'
            : step.id === 2
              ? `/dashboard/sccm/${migrationId}`
              : step.id === 3
                ? `/dashboard/sccm/${migrationId}`
                : `/dashboard/sccm/${migrationId}/migrate`;

          return (
            <Link key={step.id} href={href} className="hover:opacity-80 transition-opacity">
              {stepContent}
            </Link>
          );
        }

        return <div key={step.id}>{stepContent}</div>;
      })}
    </div>
  );
}
