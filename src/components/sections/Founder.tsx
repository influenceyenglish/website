import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Founder.module.css";
export function Founder() {
  return (
    <section id="about" className={styles.founder}>
      <div className={styles.founderContent}>
        <p className="eyebrow">About</p>
        <AnimatedText>{site.founder.heading}</AnimatedText>
        <Reveal className={styles.paragraphs}>
          {site.founder.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
        <div className={styles.divider} />
        <div className={styles.stats}>
          {site.founder.stats.map((stat) => (
            <div key={stat.value}>
              <p>{stat.value}</p>
              <span className="eyebrow">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`rounded-2xl overflow-hidden`}>
        <Reveal>
          <img
            src="/images/founder.webp"
            alt="Influencey English founder, Haris"
            width={400}
            height={400}
            className={`object-cover w-full h-full`}
          />
        </Reveal>
      </div>
    </section>
  );
}
