import { createFileRoute } from "@tanstack/react-router";
import { AppStateProvider, useAppState } from "@/context/AppStateContext";
import { Login } from "@/components/Login";
import { MemberDashboard } from "@/components/MemberDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CollectorDashboard } from "@/components/CollectorDashboard";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GRT Portal — Community Investment Fund" },
      {
        name: "description",
        content:
          "Transparent management of monthly community contributions, admin ledgers, and business investment profit shares.",
      },
      { property: "og:title", content: "GRT Portal — Community Investment Fund" },
      {
        property: "og:description",
        content:
          "Track deposits, admin transfers, and profit shares across community-owned ventures.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppStateProvider>
      <Screen />
      <RoleSwitcher />
      <Toaster richColors position="top-right" />
    </AppStateProvider>
  );
}

function Screen() {
  const { state, currentMember, currentAdmin } = useAppState();
  if (!state.currentUserId) return <Login />;

  const m = currentMember();
  const a = currentAdmin();
  const loggedInName = a?.name ?? m?.name ?? "";

  const isAdmin = a?.role === "admin" || state.currentUserId.toLowerCase() === "admin";
  const isCollector =
    a?.role === "collector" ||
    m?.isCollector ||
    m?.role === "collector" ||
    state.admins.some(
      (adm) =>
        adm.role === "collector" &&
        (adm.id === state.currentUserId ||
          (loggedInName &&
            adm.name.trim().toLowerCase() === loggedInName.trim().toLowerCase()))
    );

  if (state.currentRole === "admin" && isAdmin) {
    return <AdminDashboard />;
  }

  if (state.currentRole === "collector" && (isCollector || isAdmin)) {
    return <CollectorDashboard />;
  }

  if (state.currentRole === "member" || m) {
    return <MemberDashboard />;
  }

  if (a) {
    return a.role === "admin" ? <AdminDashboard /> : <CollectorDashboard />;
  }

  // Fallback default to member view if role is null/missing or state is unhandled
  return <MemberDashboard />;
}
