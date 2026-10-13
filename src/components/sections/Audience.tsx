import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { CheckIcon } from "@/components/ui/Icons";
import styles from "./Audience.module.css";
export function Audience() {
  return (
    <section id="who-its-for" className={styles.audience}>
      <Reveal className={styles.audienceVisual}>
        <div className={styles.practiceCard}>
          <p className="eyebrow">Your next chapter</p>
          <p className={styles.practiceWord}>
            Your voice
            <br />
            belongs
            <br />
            in the room.
          </p>
          <p>Especially when you’re just starting out.</p>
        </div>
      </Reveal>
      <div className={styles.audienceCopy}>
        <AnimatedText>
          For your first role. And your next conversation.
        </AnimatedText>
        <p>
          Built mainly for men starting or newly entering their careers — and
          for people ready to practise with respect and consistency.
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
