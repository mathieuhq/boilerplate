import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

type LayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="bg-primary-foreground container grid h-svh flex-col items-center justify-center lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <Card className="p-6">
          <Logo width={48} height={48} className="mx-auto" />
          {children}
        </Card>
      </div>
    </div>
  );
}
