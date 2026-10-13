"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  speed?: number;
  mobileSpeed?: number;
  reverse?: boolean;
  mobileReverse?: boolean;
  axis?: "x" | "y";
  mobileAxis?: "x" | "y";
  gap?: number;
  hoverSpeed?: number;
};

/** React-rendered copies make a seamless track without DOM cloning. Speed is px/sec. */
export function Ticker({
  children,
  className = "",
  speed = 40,
  mobileSpeed = speed,
  reverse = false,
  mobileReverse = reverse,
  axis = "x",
  mobileAxis = axis,
  gap = 24,
  hoverSpeed = 1,
}: Props) {
  const viewport = useRef<HTMLDivElement>(null),
    track = useRef<HTMLDivElement>(null),
    group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = viewport.current,
      moving = track.current,
      first = group.current;
    if (!root || !moving || !first) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)"),
      mobile = window.matchMedia("(max-width: 809px)");
    let frame = 0,
      previous = 0,
      position = 0,
      distance = 0,
      hovered = false,
      visible = false;
    const measure = () => {
      const vertical = (mobile.matches ? mobileAxis : axis) === "y";
      distance =
        (vertical
          ? first.getBoundingClientRect().height
          : first.getBoundingClientRect().width) +
        parseFloat(getComputedStyle(moving).gap || "0");
    };
    const tick = (now: number) => {
      if (visible && !reduced.matches && distance > 0) {
        const elapsed = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
        position =
          (position +
            elapsed *
              (mobile.matches ? mobileSpeed : speed) *
              (hovered ? hoverSpeed : 1)) %
          distance;
        const reversed = mobile.matches ? mobileReverse : reverse;
        moving.style.transform = `translate${(mobile.matches ? mobileAxis : axis) === "y" ? "Y" : "X"}(${reversed ? position - distance : -position}px)`;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(first);
    resize.observe(root);
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    observer.observe(root);
    const enter = () => {
        hovered = true;
      },
      leave = () => {
        hovered = false;
      };
    root.addEventListener("mouseenter", enter);
    root.addEventListener("mouseleave", leave);
    mobile.addEventListener("change", measure);
    measure();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      root.removeEventListener("mouseenter", enter);
      root.removeEventListener("mouseleave", leave);
      mobile.removeEventListener("change", measure);
    };
  }, [
    axis,
    mobileAxis,
    speed,
    mobileSpeed,
    hoverSpeed,
    reverse,
    mobileReverse,
  ]);
  return (
    <div
      ref={viewport}
      className={`ticker ticker--${axis} ticker--mobile-${mobileAxis} ${className}`}
      style={{ "--ticker-gap": `${gap}px` } as CSSProperties}
    >
      <div ref={track} className="ticker__track">
        {[0, 1, 2].map((copy) => (
          <div
            key={copy}
            ref={copy === 0 ? group : undefined}
            className="ticker__group"
            aria-hidden={copy > 0 ? true : undefined}
            inert={copy > 0 ? true : undefined}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
