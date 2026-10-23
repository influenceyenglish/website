import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { business, policyLinks } from "@/content/business";
import styles from "./Footer.module.css";
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <p>Influence others with your change in fluency</p>
          <Button href="/#pricing" />
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/#about">About Hashim</Link>
          <Link href="/#pricing">Pricing</Link>
          {policyLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {/* <div className={styles.business}>
        <p>Influency English · Operated by {business.operator}</p>
        <p>Legal/business name: {business.legalName}</p>
        <address>{business.address}</address>
        <p>
          <a href={`mailto:${business.email}`}>{business.email}</a> ·{" "}
          <a href={business.phoneHref}>{business.phone}</a>
        </p>
        <p>Online English-speaking practice community · INR subscriptions</p>
      </div> */}
      <p className={styles.copyright}>© 2026 Influency English</p>
      <p className={styles.wordmark} aria-hidden="true">
        Influency
      </p>
    </footer>
  );
}
