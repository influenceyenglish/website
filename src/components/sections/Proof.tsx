import Image from "next/image";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Ticker } from "@/components/motion/Ticker";
import { Button } from "@/components/ui/Button";
import { Video } from "@/components/ui/Video";
import styles from "./Proof.module.css";

type ProofCard =
  | {
      id: string;
      type: "quote";
      quote: string;
      author: string;
      profession: string;
      image?: string;
      placeholder: true;
    }
  | { id: string; type: "video"; src: string; label: string; poster: string };

// Each clip appears once. Non-repeating tickers move these rows back and forth.
// Sample quotes/profiles must be replaced with consented feedback before being
// presented as genuine testimonials. No student portrait is assigned to them.
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
        id: "nihal-video",
        type: "video",
        src: "/videos/students/nihal-short.mp4",
        label: "M Nihal shares his speaking experience",
        poster: "/images/students/nihal1.webp",
      },
      {
        id: "aarav-quote",
        type: "quote",
        quote:
          "I still pause to find the right words, but I no longer stay silent in team meetings. Daily conversations make it easier to speak up.",
        author: "Aarav Menon",
        profession: "Software Engineer",
        placeholder: true,
      },
      {
        id: "nuha-video",
        type: "video",
        src: "/videos/students/nuha-short.mp4",
        label: "Nuha shares her speaking experience",
        poster: "/images/students/nuha1.webp",
      },
      {
        id: "jamsheer-video",
        type: "video",
        src: "/videos/students/jamsheer-short.mp4",
        label: "Jamsheer shares his speaking experience",
        poster: "/images/students/jamsheer1.webp",
      },
    ],
    [
      {
        id: "minha-video",
        type: "video",
        src: "/videos/students/minha-short.mp4",
        label: "Minha shares her speaking experience",
        poster: "/images/students/minha1.webp",
      },
      {
        id: "ananya-quote",
        type: "quote",
        quote:
          "Practising with a partner keeps me consistent. I am getting better at explaining my ideas without planning every sentence in my head.",
        author: "Ananya Nair",
        profession: "Marketing Executive",
        placeholder: true,
      },
      {
        id: "noor-video",
        type: "video",
        src: "/videos/students/noor-short.mp4",
        label: "Noor shares his speaking experience",
        poster: "/images/students/noor1.webp",
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
        Student voices
      </p>
      <p>
        Watch the student videos below. Sample quote cards are labelled
        separately.
      </p>
      <a href="#members">Explore the student stories &darr;</a>
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
            hoverSpeed={0}
            repeat={false}
          >
            {row.map((card) =>
              card.type === "video" ? (
                <div
                  className={`${styles.card} ${styles.videoCard}`}
                  key={card.id}
                >
                  <Video
                    src={card.src}
                    label={card.label}
                    poster={card.poster}
                    controls
                  />
                </div>
              ) : (
                <figure
                  className={`${styles.card} ${styles.quoteCard}`}
                  key={card.id}
                >
                  <div className={styles.quoteHeader}>
                    <span className={styles.quoteMark} aria-hidden="true">
                      &ldquo;
                    </span>
                    <span className={styles.sampleLabel}>Sample quote</span>
                  </div>
                  <blockquote>{card.quote}</blockquote>
                  <figcaption>
                    {card.image ? (
                      <Image src={card.image} alt="" width={44} height={44} />
                    ) : (
                      <span className={styles.avatar} aria-hidden="true">
                        {card.author
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    )}
                    <span className={styles.attribution}>
                      <strong>{card.author}</strong>
                      <span>{card.profession}</span>
                    </span>
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
