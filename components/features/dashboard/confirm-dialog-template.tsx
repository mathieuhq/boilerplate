import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { LoadingButton } from "../form/form-button";

type ConfirmDialogTemplateProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export const ConfirmDialogTemplate = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending,
  destructive,
  onConfirm,
  onOpenChange,
}: ConfirmDialogTemplateProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <LoadingButton
          type="button"
          loading={pending}
          variant={destructive ? "destructive" : "default"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </LoadingButton>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
