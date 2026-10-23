import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentShell } from "@/components/legal/DocumentShell";
import { policies, isPolicyKey } from "@/content/policies";
import { business } from "@/content/business";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(policies).map((policy) => ({ policy }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const { policy } = await params;
  if (!isPolicyKey(policy)) return {};
  return {
    title: policies[policy].title,
    description: policies[policy].description,
    alternates: { canonical: `/${policy}` },
  };
}
export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy } = await params;
  if (!isPolicyKey(policy)) notFound();
  const document = policies[policy];
  return (
    <DocumentShell
      title={document.title}
      description={document.description}
      draft={!business.detailsConfirmed}
    >
      {document.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>
      ))}
    </DocumentShell>
  );
}
