import Image from "next/image";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Ticker } from "@/components/motion/Ticker";
import { Button } from "@/components/ui/Button";
import { Video } from "@/components/ui/Video";
import styles from "./Proof.module.css";

type ProofCard =
  | {
      type: "quote";
      quote: string;
      author: string;
      image: string;
      rating: number;
    }
  | { type: "video"; src: string; label: string };

// Edit this object to change the heading, button, quotes, ratings or videos.
const proofContent: {
  heading: string;
  button: { label: string; href: string };
  rows: ProofCard[][];
} = {
  heading: "The proof is in the people",
  button: { label: "Join us now", href: "#pricing" },
  rows: [
    [
      {
        type: "quote",
        quote:
          "I used to know the answer, but I was too nervous to say it. Now I speak with more confidence.",
        author: "M Nihal, Software Engineer",
        image: "/images/students/student_2.webp",
        rating: 5,
      },
      {
        type: "video",
        src: "/images/students/student_6.mp4",
        label: "Student speaking about their experience",
      },
      {
        type: "quote",
        quote:
          "The best part is the practice. I’m speaking more instead of only learning grammar.",
        author: "Shaheer S, Network Professional",
        image: "/images/students/student_3.webp",
        rating: 5,
      },
    ],
    [
      {
        type: "quote",
        quote:
          "I don’t overthink every sentence anymore. Speaking English feels much more natural now.",
        author: "Rahila A, Govt Employee",
        image: "/images/students/student_5.webp",
        rating: 5,
      },
      {
        type: "video",
        src: "/videos/audience.mp4",
        label: "English speaking practice in the community",
      },
      {
        type: "quote",
        quote:
          "I can express my ideas much more clearly now, especially in meetings and interviews.",
        author: "George P, Engineering Student",
        image: "/images/students/student_6.webp",
        rating: 5,
      },
    ],
  ],
};

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
      <AnimatedText className={styles.heading}>
        {proofContent.heading}
      </AnimatedText>
      <div className={styles.rows}>
        {proofContent.rows.map((row, rowIndex) => (
          <Ticker
            key={rowIndex}
            className={styles.proofTicker}
            reverse={rowIndex === 1}
            speed={28}
            mobileSpeed={20}
            gap={20}
            hoverSpeed={0.2}
          >
            {row.map((card, index) =>
              card.type === "video" ? (
                <div
                  className={`${styles.card} ${styles.videoCard}`}
                  key={index}
                >
                  <Video src={card.src} label={card.label} />
                </div>
              ) : (
                <figure
                  className={`${styles.card} ${styles.quoteCard}`}
                  key={index}
                >
                  <div
                    className={styles.stars}
                    aria-label={`${card.rating} out of 5 stars`}
                  >
                    {"★".repeat(Math.max(0, Math.min(5, card.rating)))}
                  </div>
                  <blockquote>“{card.quote}”</blockquote>
                  <figcaption>
                    <Image src={card.image} alt="" width={40} height={40} />
                    <span>{card.author}</span>
                  </figcaption>
                </figure>
              ),
            )}
          </Ticker>
        ))}
      </div>
      <Button href={proofContent.button.href} className={styles.joinButton}>
        {proofContent.button.label}
      </Button>
    </section>
  );
}
