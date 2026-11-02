import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const PageLayout = ({
  desc,
  title,
  children,
  className,
  fill = false,
}: {
  desc: string;
  title: string;
  className?: string;
  fill?: boolean;
  children: React.JSX.Element;
}) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Separator className="mt-6 flex-none" />
      {fill ? (
        <div
          className={cn(
            "-mx-1 flex min-h-0 max-w-2xl flex-1 flex-col px-1 pt-6 pb-6",
            className,
          )}
        >
          {children}
        </div>
      ) : (
        <ScrollArea className="-mx-1 min-h-0 flex-1 scroll-smooth">
          <div className={cn("max-w-2xl px-1 pt-6 pb-16", className)}>
            {children}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
