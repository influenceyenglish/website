import Image from "next/image";
import { site, heroRows, invitationStudent } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import styles from "./Invitation.module.css";

const invitationButton = { label: "Let’s try a month", href: "#pricing" };

export function Invitation() {
  const cards = heroRows.flat();
  const student = invitationStudent;
  const quote = cards.find((card) => card.type === "quote");
  return (
    <section id="outcomes" className={styles.invitation}>
      <div className={styles.invitationCopy}>
        <AnimatedText className={styles.heading}>
          Ready to stop figuring it out alone?
        </AnimatedText>
        <p className={styles.subtitle}>
          The practice, the feedback, the people — all of it is waiting. Join a
          community that helps you find your voice.
        </p>
        <div className={styles.invitationActions}>
          <Button href={invitationButton.href} className={styles.joinButton}>
            {invitationButton.label}
          </Button>
          <p className={styles.note}>{site.hero.note}</p>
        </div>
      </div>
      <div className={styles.sideCards}>
        {student && (
          <Reveal className={styles.floatingPortrait} rotateFrom={-8}>
            <figure className={styles.portrait}>
              <Image
                src={student.image}
                alt={student.alt}
                fill
                quality={80}
                sizes="(max-width: 809px) 44vw, (max-width: 1199px) 220px, 298px"
              />
              <figcaption>
                <strong>{student.author}</strong>
                <span>{student.qualification}</span>
              </figcaption>
            </figure>
          </Reveal>
        )}
        {quote && student && (
          <Reveal className={styles.floatingQuote} rotateFrom={12}>
            <figure className={styles.quote}>
              <div className={styles.stars} aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <blockquote>“{quote.quote}”</blockquote>
              <figcaption>
                <Image src={student.image} alt="" width={36} height={36} />
                <span>{quote.author}</span>
              </figcaption>
            </figure>
          </Reveal>
        )}
      </div>
    </section>
  );
}
