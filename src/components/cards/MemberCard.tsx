import Image from "next/image";
import type { MemberCard as MemberCardData } from "@/content/site";
import styles from "./cards.module.css";

export function MemberCard({
  card,
  eager = false,
}: {
  card: MemberCardData;
  eager?: boolean;
}) {
  if (card.type === "video")
    return (
      <article
        className={`${styles.member} ${styles.photo} ${styles.captioned}`}
      >
        <video
          src={card.video}
          aria-label={card.label}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className={styles.portraitLabel}>
          <h3>{card.author}</h3>
          <p>{card.qualification}</p>
        </div>
      </article>
    );
  if (card.type === "photo")
    return (
      <article
        className={`${styles.member} ${styles.photo} ${styles.captioned}`}
      >
        <Image
          src={card.image}
          alt={card.alt}
          fill
          quality={80}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          sizes="(max-width: 809px) 212px, (max-width: 1199px) 239px, 298px"
        />
        <div className={styles.portraitLabel}>
          <h3>{card.author || "[Name]"}</h3>
          <p>{card.qualification || "[Qualification]"}</p>
        </div>
      </article>
    );
  if (card.type === "portrait")
    return (
      <article className={`${styles.member} ${styles.portrait}`}>
        <Image
          src={card.image}
          alt={`Portrait of ${card.author}`}
          width={800}
          height={800}
          quality={80}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          sizes="(max-width: 809px) 212px, (max-width: 1199px) 239px, 298px"
        />
        <div className={styles.portraitLabel}>
          <h3>{card.author}</h3>
          <p>{card.description}</p>
        </div>
      </article>
    );
  if (card.type === "quote")
    return (
      <figure className={`${styles.member} ${styles.quoteCard}`}>
        <span className={styles.quoteMark} aria-hidden="true">
          “
        </span>
        <blockquote>{card.quote}</blockquote>
        <figcaption>{card.author || "[Name]"}</figcaption>
      </figure>
    );
  return (
    <article
      className={`${styles.member} ${card.type === "stat" && card.accent ? styles.accent : ""}`}
    >
      <div>
        <p className={styles.number}>{card.value}</p>
        <h3>{card.description}</h3>
      </div>
      {card.author && <p className={styles.author}>{card.author}</p>}
    </article>
  );
}
