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
      { title: "Ameen Portal — Community Investment Fund" },
      {
        name: "description",
        content:
          "Transparent management of monthly community contributions, admin ledgers, and business investment profit shares — in QR.",
      },
      { property: "og:title", content: "Ameen Portal — Community Investment Fund" },
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
  
  // Collector logic: Show both dashboards if user has collector role
  if (state.currentRole === "collector") {
    return (
      <div className="space-y-8">
        <AdminDashboard />
        <MemberDashboard />
      </div>
    );
  }

  if (state.currentRole === "admin" && currentAdmin()) return <AdminDashboard />;
  if (currentMember()) return <MemberDashboard />;
  return <Login />;
}
