import { ErrorTemplate } from "@/components/features/error/error-template";

export function ServiceUnavailableView() {
  return (
    <ErrorTemplate
      code={503}
      title="Service Unavailable"
      description={
        <>
          We&apos;re currently under maintenance. <br />
          Please check back soon.
        </>
      }
    />
  );
}
