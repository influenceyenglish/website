import type { ReactNode } from "react";
import { site } from "@/content/site";

export function Button({
  children = "Join Influencey",
  href = site.joinHref,
  className = "",
}: {
  children?: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a className={`button ${className}`} href={href}>
      {children}
    </a>
  );
}
