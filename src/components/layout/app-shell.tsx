import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar items={navigationItems} />
      <div className="min-w-0 flex-1">
        <Topbar items={navigationItems} userEmail={userEmail} />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
