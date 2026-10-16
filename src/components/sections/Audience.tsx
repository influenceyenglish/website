import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { CheckIcon } from "@/components/ui/Icons";
import { Video } from "@/components/ui/Video";
import styles from "./Audience.module.css";
export function Audience() {
  return (
    <section id="who-its-for" className={styles.audience}>
      <Reveal className={styles.audienceVisual}>
        <Video
          src="/videos/audience.mp4"
          label="English speaking practice community"
        />
      </Reveal>
      <div className={styles.audienceCopy}>
        <AnimatedText>This was made for you if…</AnimatedText>
        <p>
          You already know some English — you just want to speak it more
          naturally, confidently, and without overthinking
        </p>
        <Reveal className={styles.checklist}>
          {site.audience.map((item) => (
            <div className={styles.checklistItem} key={item}>
              <CheckIcon />
              <p>{item}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
