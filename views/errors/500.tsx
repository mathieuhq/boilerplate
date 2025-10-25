import { ErrorTemplate } from "@/components/features/error/error-template";

export const InternalServerErrorView = () => (
  <ErrorTemplate
    code={500}
    title="Internal Server Error"
    description={
      <>
        Something went wrong on our end. <br />
        Please try again later.
      </>
    }
  />
);
