"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StudentVideo.module.css";

export type TransformationStudent = {
  id: string;
  studentName: string;
  profession: string;
  story: string;
  video: string;
  originalDuration?: string;
};

function timestamp(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function Icon({
  kind,
}: {
  kind:
    "play" | "pause" | "copy" | "open" | "share" | "sound" | "muted" | "full";
}) {
  const paths = {
    play: "M7 4.5 20 12 7 19.5Z",
    pause: "M8 5v14M16 5v14",
    copy: "M9 9h11v11H9ZM5 15H3V3h12v2",
    open: "M14 3h7v7M21 3 10 14M10 3H3v18h18v-7",
    share: "M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8",
    sound: "m11 4-6 5H2v6h3l6 5ZM15 8q5 4 0 8",
    muted: "m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5",
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={kind === "play" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[kind]} />
    </svg>
  );
}

export function StudentVideo({ student }: { student: TransformationStudent }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [message, setMessage] = useState("");
  const label = `${student.studentName} transformation video`;
  const anchor = `student-${student.id}`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function link() {
    const url = new URL(window.location.href);
    url.hash = anchor;
    return url.href;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setMessage("Link copied");
    } catch {
      setMessage("Could not copy. Use the open link action.");
    }
  }

  async function toggle() {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    try {
      video.playbackRate = 1;
      await video.play();
    } catch {
      setMessage("Playback could not start. Please try again.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: `${student.studentName} | Influencey English`,
        url: link(),
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage("Sharing unavailable. Try Copy Link.");
    }
  }

  async function fullscreen() {
    const video = ref.current;
    if (!video) return;
    try {
      const container = video.parentElement;
      if (container?.requestFullscreen) await container.requestFullscreen();
      else
        (
          video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
        ).webkitEnterFullscreen?.();
    } catch {
      setMessage("Fullscreen is unavailable in this browser.");
    }
  }

  return (
    <div className={styles.player}>
      <video
        ref={ref}
        src={visible ? `${student.video}#t=0.001` : undefined}
        preload="metadata"
        playsInline
        muted={muted}
        aria-label={label}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration))
            setDuration(e.currentTarget.duration);
        }}
        onRateChange={(e) => {
          if (e.currentTarget.playbackRate !== 1)
            e.currentTarget.playbackRate = 1;
        }}
      />
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Copy link to ${student.studentName}`}
          title="Copy Link"
        >
          <Icon kind="copy" />
          <span>Copy Link</span>
        </button>
        <a
          href={`#${anchor}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${student.studentName} transformation`}
          title="Open student link"
        >
          <Icon kind="open" />
        </a>
        <button
          type="button"
          onClick={() => void share()}
          aria-label={`Share ${student.studentName} transformation`}
          title="Share"
        >
          <Icon kind="share" />
        </button>
      </div>
      {failed ? (
        <p className={styles.error} role="status">
          Video unavailable
        </p>
      ) : (
        <>
          {!playing && (
            <button
              type="button"
              className={styles.play}
              aria-label={`Play ${label}`}
              onClick={() => void toggle()}
            >
              <Icon kind="play" />
            </button>
          )}
          {!started && duration > 0 && (
            <div
              className={styles.duration}
              aria-label={`Duration ${timestamp(duration)}${student.originalDuration ? `, originally ${student.originalDuration}` : ""}`}
            >
              {student.originalDuration && (
                <>
                  <s>{student.originalDuration}</s>
                  <span className={styles.bolt} aria-hidden="true">
                    ⚡
                  </span>
                </>
              )}
              <span>{timestamp(duration)}</span>
            </div>
          )}
          {started && (
            <div className={styles.controls}>
              <div className={styles.controlRow}>
                <button
                  type="button"
                  aria-label={`${playing ? "Pause" : "Play"} ${label}`}
                  onClick={() => void toggle()}
                >
                  <Icon kind={playing ? "pause" : "play"} />
                </button>
                <span className={styles.time}>
                  {timestamp(current)} / {timestamp(duration)}
                </span>
                <span className={styles.speed}>1×</span>
                <button
                  type="button"
                  aria-label={`${muted ? "Unmute" : "Mute"} ${label}`}
                  onClick={() => setMuted((v) => !v)}
                >
                  <Icon kind={muted ? "muted" : "sound"} />
                </button>
                <button
                  type="button"
                  aria-label={`Fullscreen ${label}`}
                  onClick={() => void fullscreen()}
                >
                  <Icon kind="full" />
                </button>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(current, duration)}
                aria-label={`Seek ${label}`}
                aria-valuetext={`${timestamp(current)} of ${timestamp(duration)}`}
                onChange={(e) => {
                  if (ref.current) {
                    const time = Number(e.target.value);
                    ref.current.currentTime = time;
                    setCurrent(time);
                  }
                }}
              />
            </div>
          )}
        </>
      )}
      <span className={styles.status} role="status">
        {message}
      </span>
    </div>
  );
}
