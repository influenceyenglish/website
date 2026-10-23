import Image from "next/image";
import { site, heroRows } from "@/content/site";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { Reveal } from "@/components/motion/Reveal";
import { Ticker } from "@/components/motion/Ticker";
import { MemberCard } from "@/components/cards/MemberCard";
import { Button } from "@/components/ui/Button";
import { motionSettings } from "@/lib/motion";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-label="Welcome to Influency English">
      <Reveal className={styles.navigation} y={-60} trigger="mount">
        <a href="#" className={styles.logo} aria-label="Influency English home">
          <Image
            src="/images/influencey-english.svg"
            alt={site.name}
            width={574}
            height={329}
            sizes="(max-width: 809px) 156px, 198px"
            loading="eager"
            unoptimized
          />
        </a>
        <nav aria-label="Main navigation">
          {site.navigation.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </Reveal>
      <div className={styles.heroContent}>
        <div className={styles.heroCopy}>
          <AnimatedText as="h1" trigger="mount">
            {site.hero.heading}
          </AnimatedText>
          <Reveal delay={0.9} trigger="mount">
            <p>{site.hero.description}</p>
          </Reveal>
        </div>
        <div className={styles.heroActions}>
          <Reveal delay={1.1} trigger="mount">
            <Button />
          </Reveal>
          <Reveal delay={1.2} trigger="mount">
            <p className="eyebrow muted">{site.hero.note}</p>
          </Reveal>
        </div>
      </div>
      <div className={styles.heroVisual}>
        <div className={styles.heroTracks}>
          {heroRows.map((row, index) => (
            <Ticker
              key={index}
              speed={motionSettings.ticker.hero}
              mobileSpeed={motionSettings.ticker.heroMobile}
              reverse={index === 1}
              hoverSpeed={0.3}
              className={styles.heroTicker}
            >
              {row.map((card, i) => (
                <MemberCard key={i} card={card} />
              ))}
            </Ticker>
          ))}
        </div>
      </div>
    </section>
  );
}
