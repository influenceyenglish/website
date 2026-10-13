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
        gap={16}
        speed={40}
        reverse
        hoverSpeed={0.3}
      >
        {site.problem.images.map((image) => (
          <Image
            key={image.src}
            className={styles.problemPhoto}
            src={image.src}
            alt={image.alt}
            width={400}
            height={400}
            sizes="(max-width: 809px) 216px, 288px"
          />
        ))}
      </Ticker>
      <p className={styles.illustrationNote}>
        Illustrative speaking and work scenarios ? not student photographs.
      </p>
      <p className={`${styles.callout} eyebrow`}>{site.problem.callout}</p>
    </section>
  );
}
