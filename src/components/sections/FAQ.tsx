"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { faqs } from "@/content/site";
import { motionSettings } from "@/lib/motion";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./FAQ.module.css";

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const reduced = useReducedMotion();
  return (
    <Reveal delay={0.1 + index * 0.05} y={20} spring>
      <motion.article
        className={`${styles.faqItem} ${open ? styles.faqOpen : ""}`}
        layout
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", duration: 0.5, bounce: 0.2 }
        }
      >
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`faq-answer-${index}`}
            id={`faq-question-${index}`}
            onClick={() => setOpen((value) => !value)}
          >
            {question}
            <span className={styles.faqIcon} aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </h3>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={`faq-answer-${index}`}
              role="region"
              aria-labelledby={`faq-question-${index}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", duration: 0.5, bounce: 0.2 }
              }
              className={styles.faqAnswer}
            >
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { ...motionSettings.spring, delay: 0.1 }
                }
              >
                {answer}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </Reveal>
  );
}

export function FAQ() {
  return (
    <section id="faq" className={styles.faq}>
      <AnimatedText trigger="mount">
        {"A few things people ask\nbefore joining."}
      </AnimatedText>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <FAQItem key={faq.question} {...faq} index={index} />
        ))}
      </div>
    </section>
  );
}
