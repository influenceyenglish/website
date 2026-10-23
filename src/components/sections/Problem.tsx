import Image from "next/image";
import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { Ticker } from "@/components/motion/Ticker";
import styles from "./Problem.module.css";

export function Problem() {
  return (
    <section id="speaking-problem" className={styles.problem}>
      <div className={styles.problemCopy}>
        <AnimatedText>{site.problem.heading}</AnimatedText>
        <Reveal delay={1} className={styles.paragraphs}>
          {site.problem.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
      </div>
      <Ticker
        className={styles.photoTicker}
        gap={20}
        speed={40}
        reverse
        hoverSpeed={0.3}
      >
        {site.problem.features.map((feature) => (
          <figure key={feature.src} className={styles.featureCard}>
            <Image
              className={styles.problemPhoto}
              src={feature.src}
              alt={feature.alt}
              fill
              sizes="(max-width: 809px) 300px, (min-width: 1600px) 440px, 400px"
            />
            <figcaption className={styles.featureCaption}>
              <h3>{feature.title}</h3>
              <p>{feature.detail}</p>
            </figcaption>
          </figure>
        ))}
      </Ticker>
      <p className={`${styles.callout} eyebrow`}>{site.problem.callout}</p>
    </section>
  );
}
