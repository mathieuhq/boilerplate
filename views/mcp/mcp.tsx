import { SectionTemplate } from "@/components/features/dashboard/section-template";
import {
  ClaudeLogo,
  CursorLogo,
  OpenAiLogo,
  VsCodeLogo,
} from "@/components/features/mcp/client-logos";
import { CodeBlock } from "@/components/features/mcp/code-block";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/i18n";
import { SITE_CONFIG } from "@/lib/site-config";

type McpViewProps = {
  mcpUrl: string;
};

const STEPS = ["addUrl", "signIn", "useTools"] as const;

function getClients(mcpUrl: string) {
  const serverName = SITE_CONFIG.APP_ID;

  return [
    { key: "chatgpt", logo: OpenAiLogo, code: mcpUrl },
    { key: "claude", logo: ClaudeLogo, code: mcpUrl },
    {
      key: "cursor",
      logo: CursorLogo,
      code: JSON.stringify(
        { mcpServers: { [serverName]: { url: mcpUrl } } },
        null,
        2,
      ),
    },
    {
      key: "vscode",
      logo: VsCodeLogo,
      code: JSON.stringify(
        { servers: { [serverName]: { type: "http", url: mcpUrl } } },
        null,
        2,
      ),
    },
  ];
}

export const McpView = ({ mcpUrl }: McpViewProps) => {
  const t = useTranslations("mcp");
  const clients = getClients(mcpUrl);

  return (
    <SectionTemplate title={t("title")} description={t("description")}>
      <ScrollArea className="-mx-1 min-w-0 flex-1">
        <div className="max-w-3xl space-y-6 px-1 pb-16">
          <Card>
            <CardHeader>
              <CardTitle>{t("server.title")}</CardTitle>
              <CardDescription>{t("server.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={mcpUrl} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("steps.title")}</CardTitle>
              <CardDescription>{t("steps.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-4 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground text-sm">
                      {t(`steps.${step}`)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("clients.title")}</CardTitle>
              <CardDescription>{t("clients.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={clients[0].key} className="gap-4">
                <TabsList className="w-full [scrollbar-width:none] justify-start overflow-x-auto">
                  {clients.map((client) => (
                    <TabsTrigger
                      key={client.key}
                      value={client.key}
                      className="flex-none px-3 py-1.5"
                    >
                      <client.logo />
                      {t(`clients.${client.key}.name`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {clients.map((client) => (
                  <TabsContent
                    key={client.key}
                    value={client.key}
                    className="space-y-3"
                  >
                    <p className="text-muted-foreground text-sm">
                      {t(`clients.${client.key}.instructions`)}
                    </p>
                    <CodeBlock code={client.code} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </SectionTemplate>
  );
};
