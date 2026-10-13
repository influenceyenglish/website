import Image from "next/image";
import styles from "./cards.module.css";

export type Testimonial = { quote: string; author: string; image: string };

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={styles.testimonial}>
      <div className={styles.stars} aria-label="5 out of 5 stars">
        ★★★★★
      </div>
      <blockquote>{testimonial.quote}</blockquote>
      <figcaption>
        <Image src={testimonial.image} width={28} height={28} alt="" />
        <span>{testimonial.author}</span>
      </figcaption>
    </figure>
  );
}
