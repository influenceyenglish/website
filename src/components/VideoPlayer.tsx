"use client";

import { useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

export function VideoPlayer({
  src,
  poster,
  label,
  fallback = "The video is unavailable. Please try again later.",
}: {
  src: string;
  poster?: string;
  label: string;
  fallback?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  async function play() {
    const element = video.current;
    if (!element) return;
    element.controls = true;
    try {
      await element.play();
      setStarted(true);
      element.focus();
    } catch {
      element.controls = false;
      setStarted(false);
    }
  }

  return (
    <div className={styles.player}>
      {unavailable ? (
        <p className={styles.fallback} role="status">
          {fallback}
        </p>
      ) : (
        <>
          <video
            ref={video}
            src={src}
            poster={poster}
            controls={started}
            playsInline
            preload={poster ? "none" : "metadata"}
            aria-label={label}
            tabIndex={started ? 0 : -1}
            onPlay={() => setStarted(true)}
            onError={() => setUnavailable(true)}
          >
            Your browser cannot play this video.
          </video>
          {!started && (
            <button
              type="button"
              className={styles.play}
              aria-label={`Play ${label.toLowerCase()}`}
              onClick={() => void play()}
            >
              <span className={styles.circle}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9 5.5a1 1 0 0 1 1.5-.86l10 6.5a1 1 0 0 1 0 1.72l-10 6.5A1 1 0 0 1 9 18.5z" />
                </svg>
              </span>
              <span className={styles.caption}>
                {label}
                <span>Tap to play</span>
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
