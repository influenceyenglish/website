import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // Match card widths and their 2x variants instead of sending full originals.
    imageSizes: [32, 48, 64, 96, 128, 212, 239, 288, 298, 424, 478, 576, 596],
    qualities: [75, 80],
  },
};
export default config;
