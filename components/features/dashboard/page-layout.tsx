import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const PageLayout = ({
  desc,
  title,
  children,
  className,
}: {
  desc: string;
  title: string;
  className?: string;
  children: React.JSX.Element;
}) => {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-none space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
      <Separator className="mt-6 flex-none" />
      <ScrollArea className="-mx-1 flex-1 scroll-smooth">
        <div className={cn("max-w-2xl px-1 pt-6 pb-16", className)}>
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};
