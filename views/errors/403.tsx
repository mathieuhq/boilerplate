import { ErrorTemplate } from "@/components/features/error/error-template";

export const ForbiddenView = () => (
  <ErrorTemplate
    code={403}
    title="Access Forbidden"
    description={
      <>
        You don&apos;t have necessary permission <br />
        to view this resource.
      </>
    }
  />
);
