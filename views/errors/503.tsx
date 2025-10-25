import { ErrorTemplate } from "@/components/features/error/error-template";

export const ServiceUnavailableView = () => (
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
