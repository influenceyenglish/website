import Image from "next/image";
import type { MemberCard as MemberCardData } from "@/content/site";
import styles from "./cards.module.css";

export function MemberCard({ card }: { card: MemberCardData }) {
  if (card.type === "portrait")
    return (
      <article className={`${styles.member} ${styles.portrait}`}>
        <Image
          src={card.image}
          alt={`Portrait of ${card.author}`}
          width={800}
          height={800}
          sizes="(max-width: 809px) 212px, 298px"
        />
        <div className={styles.portraitLabel}>
          <h3>{card.author}</h3>
          <p>{card.description}</p>
        </div>
      </article>
    );
  return (
    <article
      className={`${styles.member} ${card.type === "stat" && card.accent ? styles.accent : ""}`}
    >
      {card.type === "stat" ? (
        <div>
          <p className={styles.number}>{card.value}</p>
          <h3>{card.description}</h3>
        </div>
      ) : (
        <h3>{card.quote}</h3>
      )}
      <p className={styles.author}>{card.author}</p>
    </article>
  );
}
