import { Logo } from "@/components/ui/logo";
import { SITE_CONFIG } from "@/lib/site-config";

type LayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: LayoutProps) {
  return (
    <div className="bg-primary-foreground container grid h-svh flex-col items-center justify-center lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <div className="mb-4 flex items-center justify-center">
          <Logo width={24} height={24} className="mr-2" />
          <h1 className="text-xl font-medium">{SITE_CONFIG.TITLE}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
