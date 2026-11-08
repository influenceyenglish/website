"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./ShadowGym.module.css";

export function ShadowGym() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section
      id="shadow-gym"
      aria-labelledby="shadow-gym-heading"
      className={`${styles.section} bg-[var(--white)] px-[var(--page-gutter)] py-16 text-[var(--primary-dark)] min-[810px]:py-20`}
    >
      <div className="mx-auto max-w-[var(--content-width)] text-center">
        <h2 id="shadow-gym-heading">Shadow Gym</h2>
        <p className="mx-auto mt-6 max-w-[800px] text-base leading-normal min-[810px]:text-xl min-[1200px]:text-[22px]">
          Shadowing is an effective way to practise a language and its accent.
          Listen and speak along with the voice in real time, then repeat to
          develop more natural pronunciation and sound closer to a native
          speaker.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 min-[810px]:mt-16 min-[810px]:grid-cols-[1.45fr_1fr_1fr]">
          <div
            className={`${styles.videoCard} relative min-w-0 overflow-hidden rounded-[24px] border border-solid border-[var(--border)] bg-[var(--background-tint)]`}
          >
            {isPlaying ? (
              <iframe
                ref={(element) => element?.focus()}
                src="https://www.youtube-nocookie.com/embed/Z94WLmRgZ6s?autoplay=1&rel=0"
                title="Shadow Gym — Free Session"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsPlaying(true)}
                aria-label="Play Shadow Gym free session"
                className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:-outline-offset-4"
              >
                <img
                  src="https://i.ytimg.com/vi/Z94WLmRgZ6s/hqdefault.jpg"
                  alt=""
                  width={480}
                  height={360}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-xl bg-[#bdeee5] px-3 py-1.5 text-sm font-semibold text-[var(--primary-dark)] min-[1200px]:text-base">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="12" fill="#008c78" />
                    <path d="m10 7 7 5-7 5Z" fill="white" />
                  </svg>
                  Free Session
                </span>
                <span className="relative flex size-16 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--white)] min-[1200px]:size-20">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10 5a1 1 0 0 1 1.5-.86l17 11a1 1 0 0 1 0 1.72l-17 11A1 1 0 0 1 10 27Z" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {[2, 3].map((session) => (
            <article
              key={session}
              className="flex min-w-0 flex-col items-center justify-center rounded-[24px] border border-solid border-[var(--border)] bg-[var(--background-tint)] px-5 py-9 min-[810px]:min-h-[270px]"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                aria-hidden="true"
              >
                <rect x="9" y="20" width="30" height="25" rx="4" />
                <path d="M14 20v-7a10 10 0 0 1 20 0v7" />
              </svg>
              <h3 className="mt-5 text-[26px] min-[1200px]:text-[32px]">
                Session {session}
              </h3>
              <p className="mt-4 max-w-[290px] text-base leading-normal min-[1200px]:text-[19px]">
                Unlock this and more practice sessions with a membership.
              </p>
              <Button className="mt-6">Unlock sessions</Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
