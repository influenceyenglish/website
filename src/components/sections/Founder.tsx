import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { VideoPlayer } from "@/components/VideoPlayer";
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
          <VideoPlayer
            src="/videos/hashim-founder.mp4#t=0.001"
            label="Hi"
          />
        </Reveal>
      </div>
    </section>
  );
}
