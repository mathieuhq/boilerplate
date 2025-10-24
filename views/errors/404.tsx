import { ErrorTemplate } from "@/components/features/error/error-template";

export function NotFoundView() {
  return (
    <ErrorTemplate
      code={404}
      title="Page Not Found"
      description={
        <>
          The page you are looking for doesn&apos;t exist <br />
          or has been moved.
        </>
      }
    />
  );
}
