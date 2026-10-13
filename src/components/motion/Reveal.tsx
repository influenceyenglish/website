"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { motionSettings } from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
  rotateFrom?: number;
  trigger?: "mount" | "inView";
  spring?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 30,
  rotateFrom = 0,
  trigger = "inView",
  spring = false,
}: Props) {
  const reduced = useReducedMotion();
  const target = { opacity: 1, x: 0, y: 0, rotate: 0 };
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, x, y, rotate: rotateFrom }}
      animate={trigger === "mount" || reduced ? target : undefined}
      whileInView={trigger === "inView" ? target : undefined}
      viewport={{ once: true, amount: motionSettings.entrance.threshold }}
      transition={
        reduced
          ? { duration: 0 }
          : spring
            ? { ...motionSettings.spring, delay }
            : {
                duration: motionSettings.entrance.duration,
                ease: motionSettings.ease,
                delay,
              }
      }
    >
      {children}
    </motion.div>
  );
}
