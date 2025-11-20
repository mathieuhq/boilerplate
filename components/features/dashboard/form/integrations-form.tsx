"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  disconnectIntegrationAction,
  saveHabitDashKeyAction,
} from "@/actions/integration/integration.action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ApplicationError } from "@/lib/errors/application-error";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../ui/accordion";
import { FormButton } from "../../form/form-button";
import { INTEGRATIONS_ITEMS } from "../integrations/integrations.constants";

const habitDashFormSchema = z.object({
  apiKey: z
    .string()
    .min(1, "API key is required")
    .max(500, "API key is too long"),
});

type HabitDashFormValues = z.infer<typeof habitDashFormSchema>;

type IntegrationsFormProps = {
  connectedIntegrations: {
    provider: string;
    status: string;
  }[];
};

export const IntegrationsForm = ({
  connectedIntegrations,
}: IntegrationsFormProps) => {
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string>("");

  const habitDashForm = useForm<HabitDashFormValues>({
    resolver: zodResolver(habitDashFormSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  const { mutate: saveHabitDashKey, isPending: isSavingHabitDash } =
    useMutation({
      mutationFn: async (data: HabitDashFormValues) => {
        const result = await saveHabitDashKeyAction(data);

        if (!result.data?.success)
          throw new ApplicationError("Failed to save API key");

        return result.data;
      },
      onSuccess: () => {
        toast.success("API key saved successfully!");
        habitDashForm.reset();
        router.refresh();
      },
      onError: (error: Error) =>
        toast.error(error.message || "Failed to save API key"),
    });

  const { mutate: disconnectIntegration, isPending: isDisconnecting } =
    useMutation({
      mutationFn: async (provider: string) => {
        const result = await disconnectIntegrationAction({ provider });

        if (!result.data?.success)
          throw new ApplicationError("Failed to disconnect integration");

        return result.data;
      },
      onSuccess: () => {
        toast.success("Integration disconnected successfully!");
        router.refresh();
      },
      onError: (error: Error) =>
        toast.error(error.message || "Failed to disconnect integration"),
    });

  const isConnected = (provider: string) => {
    return connectedIntegrations.some(
      (integration) =>
        integration.provider === provider && integration.status === "connected",
    );
  };

  return (
    <Accordion
      collapsible
      type="single"
      value={expandedItem}
      onValueChange={setExpandedItem}
      className="flex w-full flex-col gap-4"
    >
      {INTEGRATIONS_ITEMS.map((app) => {
        const connected = isConnected(app.provider);

        return (
          <AccordionItem
            key={app.name}
            value={app.name}
            className="rounded-md border px-4 py-0"
          >
            <AccordionTrigger className="flex items-center hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="bg-muted flex size-9 items-center justify-center rounded-lg p-2">
                  <img src={app.logo} alt={app.name} className="size-full" />
                </div>
                <p>{app.name}</p>
              </div>
              <div className="mr-3 ml-auto flex h-full items-center gap-4">
                <div
                  onClick={(e) => e.stopPropagation()}
                  aria-label={connected ? "Connected" : "Connect"}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800",
                    {
                      "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900":
                        connected,
                    },
                  )}
                >
                  {connected ? "Connected" : "Connect"}
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold">Learn More</p>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-4 pt-2 pb-4">
                <p className="text-muted-foreground text-sm">{app.desc}</p>

                {connected ? (
                  <div className="bg-muted/30 flex items-center justify-between rounded-md border p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">API Key Connected</p>
                      <p className="text-muted-foreground text-xs">
                        Your API key is securely stored (••••••••••••)
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => disconnectIntegration(app.provider)}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  </div>
                ) : (
                  <Form
                    form={habitDashForm}
                    disabled={isSavingHabitDash}
                    onSubmit={async (v) => saveHabitDashKey(v)}
                    className="space-y-2"
                  >
                    <FormField
                      control={habitDashForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your Habit Dash API key"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormButton
                      type="submit"
                      className="w-full"
                      loading={isSavingHabitDash}
                    >
                      Save API Key
                    </FormButton>
                  </Form>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
