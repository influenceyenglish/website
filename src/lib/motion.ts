/** Timings recovered from the reference's published component configuration. */
export const motionSettings = {
  ease: [0.44, 0, 0.56, 1] as [number, number, number, number],
  text: { blur: 10, y: 10, duration: 0.4, stagger: 0.07, threshold: 0.5 },
  entrance: { duration: 0.4, y: 30, threshold: 0.5 },
  spring: { type: "spring" as const, duration: 0.4, bounce: 0.2 },
  scroll: { duration: 0.6 },
  ticker: { hero: 40, heroMobile: 30, photos: 40, proof: 20 },
};
