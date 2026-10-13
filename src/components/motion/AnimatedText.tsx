"use client";

import { Fragment, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { motionSettings } from "@/lib/motion";

type Props = {
  children: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  trigger?: "mount" | "inView";
};
const headings = { h1: motion.h1, h2: motion.h2, h3: motion.h3 };

/** Words retain natural wrapping, spacing, and one accessible heading label. */
export function AnimatedText({
  children,
  as = "h2",
  className,
  trigger = "inView",
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, {
    once: true,
    amount: motionSettings.text.threshold,
  });
  const reduced = useReducedMotion();
  const Heading = headings[as];
  return (
    <Heading
      ref={ref}
      className={className}
      aria-label={children.replaceAll("\n", " ")}
      initial="hidden"
      animate={reduced || trigger === "mount" || inView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : motionSettings.text.stagger,
          },
        },
      }}
    >
      {children.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && (
            <>
              <br aria-hidden="true" />{" "}
            </>
          )}
          {line.split(" ").map((word, wordIndex) => (
            <Fragment key={wordIndex}>
              {wordIndex > 0 && " "}
              <motion.span
                aria-hidden="true"
                className="animated-word"
                variants={{
                  hidden: {
                    opacity: reduced ? 1 : 0.001,
                    filter: reduced
                      ? "blur(0px)"
                      : `blur(${motionSettings.text.blur}px)`,
                    y: reduced ? 0 : motionSettings.text.y,
                  },
                  visible: { opacity: 1, filter: "blur(0px)", y: 0 },
                }}
                transition={{
                  duration: reduced ? 0 : motionSettings.text.duration,
                  ease: motionSettings.ease,
                }}
              >
                {word}
              </motion.span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Heading>
  );
}
