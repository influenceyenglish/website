import { testimonials } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./Proof.module.css";

export function StudentProof() {
  return (
    <section
      className={styles.studentProof}
      aria-labelledby="student-proof-title"
    >
      <p className="eyebrow" id="student-proof-title">
        Real voices belong here.
      </p>
      <p>
        We’re preparing consented student stories. These are clearly marked
        placeholders, not claims about student results.
      </p>
      <a href="#members">See the student story spaces ↓</a>
    </section>
  );
}
export function Proof() {
  return (
    <section id="members" className={styles.proof}>
      <AnimatedText>The practice. The people. Their words.</AnimatedText>
      <p className={styles.intro}>
        Student stories will be published only with permission and context. No
        ratings or results are invented.
      </p>
      <div className={styles.testimonials}>
        {testimonials.map((item, index) => (
          <Reveal
            key={item.title}
            delay={index * 0.08}
            className={styles.story}
          >
            <span className="eyebrow">
              Placeholder · awaiting student consent
            </span>
            <h3>{item.title}</h3>
            <p>{item.quote}</p>
            <p className={styles.placeholder}>{item.author}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
