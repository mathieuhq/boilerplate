import type { Thing, WithContext } from "schema-dts";

type JsonLdProps<T extends Thing> = {
  data: WithContext<T>;
};

function sanitizeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const JsonLd = <T extends Thing>({ data }: JsonLdProps<T>) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(data) }}
    />
  );
};
