import Link from "next/link";
import { business } from "@/content/business";
import { Footer } from "@/components/sections/Footer";
import styles from "./DocumentShell.module.css";
export function DocumentShell({
  title,
  description,
  children,
  draft = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  draft?: boolean;
}) {
  return (
    <>
      <header className={styles.header}>
        <Link href="/">Influency English</Link>
        <Link href="/#pricing">View membership →</Link>
      </header>
      <main id="main-content" className={styles.main}>
        <p className="eyebrow">Influency English</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        {draft && (
          <aside className={styles.notice}>
            Draft policy · Updated {business.updated}. Legal/business identity
            and delivery details require confirmation before live enrolment.
          </aside>
        )}
        <div className={styles.body}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
