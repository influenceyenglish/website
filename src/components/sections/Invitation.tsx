import { site } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import styles from "./Invitation.module.css";
export function Invitation() {
  return (
    <section id="outcomes" className={styles.invitation}>
      <div className={styles.invitationCopy}>
        <p className="eyebrow">Beyond fluent sentences</p>
        <AnimatedText>Become someone people want to listen to.</AnimatedText>
        <p>
          Practice for the moments that matter. These are the skills we work
          towards, not guaranteed results.
        </p>
      </div>
      <div className={styles.outcomes}>
        {site.outcomes.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.08}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </Reveal>
        ))}
      </div>
      <Button>Start practising with us</Button>
    </section>
  );
}
