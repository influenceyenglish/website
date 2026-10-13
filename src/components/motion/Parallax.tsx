"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";

const subscribe = (callback: () => void) => {
  const query = window.matchMedia("(max-width: 809px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getMobile = () => window.matchMedia("(max-width: 809px)").matches;

export function Parallax({
  children,
  className,
  speed = 0.06,
  rotation = 0,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  rotation?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [(80 * speed) / 0.06, (-80 * speed) / 0.06],
  );
  const reduced = useReducedMotion();
  const mobile = useSyncExternalStore(subscribe, getMobile, () => false);
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y: reduced || mobile ? 0 : y, rotate: rotation }}
    >
      {children}
    </motion.div>
  );
}
