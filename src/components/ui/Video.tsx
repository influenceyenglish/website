"use client";

import { useEffect, useRef } from "react";

export function Video({
  src,
  className = "",
  label,
  poster,
  controls = false,
}: {
  src: string;
  className?: string;
  label: string;
  poster?: string;
  controls?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) void video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={`video ${className}`}
      src={src}
      poster={poster}
      controls={controls}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    />
  );
}
