"use client";

import { useRef, useState } from "react";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Button } from "@/components/ui/Button";
import styles from "./Proof.module.css";

// Edit or reorder these JSON entries to update the carousel.
const proofContent = {
  badge: "Student stories",
  heading: "The proof is in the people",
  description:
    "Hear our members share how everyday speaking practice helped them build confidence in English.",
  videos: [
    {
      video: "/videos/students/nihal-short.mp4",
      poster: "/images/students/nihal1.webp",
      quote: "Now I speak with more confidence.",
      studentName: "M Nihal",
      studentProfession: "Software Engineer",
    },
    {
      video: "/videos/students/nuha-short.mp4",
      poster: "/images/students/nuha1.webp",
      quote: "Now I try to speak whenever I get the chance.",
      studentName: "Nuha A",
      studentProfession: "Influencey English member",
    },
    {
      video: "/videos/students/jamsheer-short.mp4",
      poster: "/images/students/jamsheer1.webp",
      quote: "The best part is the practice. I’m speaking more.",
      studentName: "Jamsheer",
      studentProfession: "Influencey English member",
    },
    {
      video: "/videos/students/minha-short.mp4",
      poster: "/images/students/minha1.webp",
      quote: "Speaking English feels much more natural now.",
      studentName: "Ayisha Minha",
      studentProfession: "Influencey English member",
    },
    {
      video: "/videos/students/noor-short.mp4",
      poster: "/images/students/noor1.webp",
      quote: "I can express my ideas much more clearly now.",
      studentName: "Muhammad Noor",
      studentProfession: "Influencey English member",
    },
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
      <p>Hear our members share their English speaking journeys.</p>
      <a href="#members">Explore the student stories &darr;</a>
    </section>
  );
}

export function Proof() {
  const track = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  const [error, setError] = useState("");

  function pauseOthers(index: number) {
    videos.current.forEach((video, other) => {
      if (other !== index) video?.pause();
    });
  }

  async function toggle(index: number) {
    const video = videos.current[index];
    if (!video) return;
    setError("");
    if (!video.paused) {
      video.pause();
      return;
    }
    pauseOthers(index);
    try {
      await video.play();
    } catch {
      setError(
        `Could not play ${proofContent.videos[index].studentName}’s video. Please try again.`,
      );
    }
  }

  function navigate(direction: number) {
    const element = track.current;
    const card = element?.firstElementChild;
    if (!element || !card) return;
    element.scrollBy({
      left:
        direction *
        (card.getBoundingClientRect().width +
          parseFloat(getComputedStyle(element).gap)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <section
      id="members"
      className={styles.proof}
      aria-label="Student testimonials"
    >
      <header className={styles.header}>
        <p className={styles.badge}>{proofContent.badge}</p>
        <AnimatedText className={styles.heading}>
          {proofContent.heading}
        </AnimatedText>
        <p className={styles.description}>{proofContent.description}</p>
      </header>
      <div className={styles.carousel}>
        <div
          ref={track}
          id="proof-videos"
          className={styles.track}
          role="region"
          aria-label="Student videos. Swipe or use the arrow keys to explore."
          tabIndex={0}
          onScroll={() => {
            const element = track.current;
            if (!element) return;
            setPosition({
              start: element.scrollLeft <= 2,
              end:
                element.scrollLeft + element.clientWidth >=
                element.scrollWidth - 2,
            });
            videos.current.forEach((video) => {
              if (!video || video.paused) return;
              const bounds = video.getBoundingClientRect();
              const viewport = element.getBoundingClientRect();
              if (
                bounds.right <= viewport.left ||
                bounds.left >= viewport.right
              )
                video.pause();
            });
          }}
        >
          {proofContent.videos.map((student, index) => (
            <article
              className={styles.card}
              key={student.video}
              aria-label={`${student.studentName}, ${index + 1} of ${proofContent.videos.length}`}
            >
              <video
                ref={(element) => {
                  videos.current[index] = element;
                }}
                src={student.video}
                poster={student.poster}
                preload="none"
                playsInline
                loop
                controls={playing === index}
                aria-label={`${student.studentName}’s testimonial`}
                onPlay={() => {
                  pauseOthers(index);
                  setPlaying(index);
                }}
                onPause={() =>
                  setPlaying((current) => (current === index ? null : current))
                }
                onEnded={() =>
                  setPlaying((current) => (current === index ? null : current))
                }
              />
              {playing !== index && (
                <div className={styles.overlay}>
                  <blockquote>{student.quote}</blockquote>
                  <p>
                    <strong>{student.studentName}</strong>
                    <span>{student.studentProfession}</span>
                  </p>
                </div>
              )}
              <button
                type="button"
                className={`${styles.play} ${playing === index ? styles.playing : ""}`}
                aria-label={`${playing === index ? "Pause" : "Play"} ${student.studentName}’s video`}
                onClick={() => void toggle(index)}
              >
                {playing === index ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M8 5v14M16 5v14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m8 5 12 7-12 7Z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </article>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.arrow} ${styles.previous}`}
          aria-label="Previous student video"
          aria-controls="proof-videos"
          disabled={position.start}
          onClick={() => navigate(-1)}
        >
          &larr;
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          aria-label="Next student video"
          aria-controls="proof-videos"
          disabled={position.end}
          onClick={() => navigate(1)}
        >
          &rarr;
        </button>
      </div>
      <p className={styles.status} role="status">
        {error}
      </p>
      <Button href="#pricing" className={styles.joinButton}>
        Join us now
      </Button>
    </section>
  );
}
