# Motion reference

Reference inspected: https://kindredd.framer.website/

The values below were read from the public page's appearance configuration and component bundle. They are centralized in `src/lib/motion.ts` where shared and expressed as component props for section-specific sequencing.

| Effect                         | Published setting                                                    | Implementation                              |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------- |
| Text reveal                    | word tokenization; blur 10px; opacity 0.001; y 10px                  | `AnimatedText` word variants                |
| Word timing                    | 0.4s, stagger 0.07s, cubic-bezier(0.44, 0, 0.56, 1)                  | Motion parent stagger and child transitions |
| Scroll reveal threshold        | 50%; once                                                            | Motion viewport / `useInView`               |
| Heading triggers               | hero on mount; problem and overview in view; other headings on mount | `trigger` prop per heading                  |
| Navigation                     | y -60px, 0.4s                                                        | Hero `Reveal`                               |
| Hero description, button, note | delays 0.9s, 1.1s, 1.2s; y 30px; 0.4s                                | Separate Hero reveals                       |
| Product description and cards  | description delay 0.7s; cards 0.6/0.7/0.8s; y 30px                   | Overview reveals                            |
| Spring entrance                | bounce 0.2, duration 0.4s                                            | `Reveal spring`                             |
| Hero tickers                   | 40px/s desktop, 30px/s mobile; opposite directions                   | `Ticker` speed and reverse props            |
| Photo ribbon                   | 40px/s, reverse                                                      | Problem ticker                              |
| Proof tickers                  | 20px/s; alternating vertical directions; horizontal on mobile        | Proof ticker props                          |
| Scroll smoothing               | Lenis intensity 6, mapped to duration 0.6s                           | Lenis duration 0.6s                         |
| CTA parallax                   | relative speeds 94% and 106%; disabled on mobile                     | Opposing 6% parallax components             |
| FAQ expansion                  | spring 0.5s, bounce 0.2                                              | React state, Motion layout and height       |
| FAQ answer                     | opacity 0.8; y -20px; delay 0.1s; spring 0.4s                        | Answer motion paragraph                     |

Keep ticker phase and video position out of pixel-diff expectations unless the comparison freezes both pages at the same elapsed time. Layout and interaction checks should also include reduced motion and mobile reflow.
