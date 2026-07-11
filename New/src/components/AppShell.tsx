import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LogOut } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { logout, currentMember, currentAdmin, state } = useAppState();
  const m = currentMember();
  const a = currentAdmin();
  const who = a?.name ?? m?.name ?? "Guest";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900">
                Ameen Portal
              </div>
              <div className="text-xs text-slate-500">
                {state.currentRole === "admin" ? "Admin Console" : state.currentRole === "collector" ? "Collector Portal" : "Member Portal"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-900">{who}</div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
