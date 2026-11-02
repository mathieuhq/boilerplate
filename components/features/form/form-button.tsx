import { motion } from "motion/react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

export const FormButton = (props: ButtonProps & { loading?: boolean }) => {
  const { loading, ...buttonProps } = props;

  return (
    <LoadingButton loading={loading} {...buttonProps}>
      {props.children}
    </LoadingButton>
  );
};

export const LoadingButton = ({
  loading,
  children,
  className,
  ...props
}: ButtonProps & {
  loading?: boolean;
  success?: string;
}) => (
  <Button
    {...props}
    disabled={props.disabled ?? loading}
    className={cn(className, "relative")}
  >
    <motion.span
      initial={false}
      className="flex items-center gap-1"
      animate={{
        opacity: loading ? 0 : 1,
        y: loading ? -10 : 0,
      }}
    >
      {children}
    </motion.span>
    <motion.span
      initial={false}
      animate={{
        opacity: loading ? 1 : 0,
        y: loading ? 0 : 10,
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Loader size={20} />
    </motion.span>
  </Button>
);
