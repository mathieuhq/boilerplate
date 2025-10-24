import { ErrorTemplate } from "@/components/features/error/error-template";

export function UnauthorizedView() {
  return (
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
}
