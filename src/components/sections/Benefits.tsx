import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { FeatureIcon } from "@/components/ui/Icons";
import styles from "./Benefits.module.css";
export function Benefits() {
  return (
    <section id="benefits" className={styles.section}>
      <div className={styles.heading}>
        <p className="eyebrow">Your membership</p>
        <AnimatedText>
          A place to practise. A reason to keep going.
        </AnimatedText>
        <p>
          Seven ways to put communication into action, included in both plans.
        </p>
      </div>
      <div className={styles.grid}>
        {site.includes.map((benefit, index) => (
          <Reveal key={benefit} delay={index * 0.05} className={styles.card}>
            <span className={styles.index}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{benefit}</h3>
            <FeatureIcon name={site.overview.features[index % 3].icon} />
          </Reveal>
        ))}
      </div>
      <div className={styles.details}>
        {site.benefits.map((item) => (
          <div key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
