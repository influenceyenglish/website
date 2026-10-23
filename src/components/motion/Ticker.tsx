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
  repeat?: boolean;
};

/** Repeated groups loop seamlessly; repeat=false moves one group back and forth. Speed is px/sec. */
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
  repeat = true,
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
      focused = false,
      contentOverflows = true,
      visible = false;
    const measure = () => {
      const vertical = (mobile.matches ? mobileAxis : axis) === "y";
      const contentSize = vertical
        ? first.getBoundingClientRect().height
        : first.getBoundingClientRect().width;
      const viewportSize = vertical
        ? root.getBoundingClientRect().height
        : root.getBoundingClientRect().width;
      contentOverflows = contentSize > viewportSize;
      distance = repeat
        ? contentSize + parseFloat(getComputedStyle(moving).gap || "0")
        : Math.abs(contentSize - viewportSize);
    };
    const tick = (now: number) => {
      if (visible && !reduced.matches && distance > 0) {
        const elapsed = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
        position =
          (position +
            elapsed *
              (mobile.matches ? mobileSpeed : speed) *
              (hovered || focused ? hoverSpeed : 1)) %
          (repeat ? distance : distance * 2);
        const reversed = mobile.matches ? mobileReverse : reverse;
        const bounce =
          position <= distance ? position : distance * 2 - position;
        const offset = repeat
          ? reversed
            ? position - distance
            : -position
          : (contentOverflows ? -1 : 1) *
            (reversed ? distance - bounce : bounce);
        moving.style.transform = `translate${(mobile.matches ? mobileAxis : axis) === "y" ? "Y" : "X"}(${offset}px)`;
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
      },
      focus = () => {
        focused = true;
      },
      blur = (event: FocusEvent) => {
        if (!root.contains(event.relatedTarget as Node | null)) focused = false;
      };
    root.addEventListener("mouseenter", enter);
    root.addEventListener("mouseleave", leave);
    root.addEventListener("focusin", focus);
    root.addEventListener("focusout", blur);
    mobile.addEventListener("change", measure);
    measure();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      root.removeEventListener("mouseenter", enter);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("focusin", focus);
      root.removeEventListener("focusout", blur);
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
    repeat,
  ]);
  return (
    <div
      ref={viewport}
      className={`ticker ticker--${axis} ticker--mobile-${mobileAxis} ${className}`}
      style={{ "--ticker-gap": `${gap}px` } as CSSProperties}
    >
      <div ref={track} className="ticker__track">
        {(repeat ? [0, 1, 2] : [0]).map((copy) => (
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
