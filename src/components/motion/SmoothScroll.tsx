"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { motionSettings } from "@/lib/motion";

export function SmoothScroll() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    const setup = () => {
      lenis?.destroy();
      lenis = preference.matches
        ? undefined
        : new Lenis({
            duration: motionSettings.scroll.duration,
            smoothWheel: true,
            autoRaf: true,
            anchors: true,
          });
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      preference.removeEventListener("change", setup);
      lenis?.destroy();
    };
  }, []);
  return null;
}
