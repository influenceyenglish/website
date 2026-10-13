import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { FeatureIcon } from "@/components/ui/Icons";
import styles from "./Overview.module.css";

export function Overview() {
  return (
    <section id="inside" className={styles.overview}>
      <div className={styles.overviewCopy}>
        <AnimatedText>{site.overview.heading}</AnimatedText>
        <Reveal delay={0.7} className={styles.paragraphs}>
          <p>{site.overview.description}</p>
          <p>The Corrective Feedback Loop (CFL) in practice:</p>
        </Reveal>
      </div>
      <div className={styles.featureGrid}>
        {site.overview.features.map((feature, index) => (
          <Reveal
            key={feature.title}
            delay={0.6 + index * 0.1}
            spring
            className={styles.featureCard}
          >
            <FeatureIcon name={feature.icon} />
            <div className={styles.featureText}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.8} spring>
        <Button />
      </Reveal>
    </section>
  );
}
