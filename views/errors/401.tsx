import { ErrorTemplate } from "@/components/features/error/error-template";

export const UnauthorizedView = () => (
  <ErrorTemplate
    code={401}
    title="Unauthorized Access"
    description={
      <>
        Please log in with the appropriate credentials <br /> to access this
        resource.
      </>
    }
  />
);
