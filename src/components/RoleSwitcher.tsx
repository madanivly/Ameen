import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Shield, UserCheck, User } from "lucide-react";
import { Role } from "@/types";

export function RoleSwitcher() {
  const { state, setState, currentAdmin } = useAppState();
  const a = currentAdmin();

  // Master admins may use all three views. A promoted member may only move
  // between their own Collector and Member portals.
  const isMasterAdmin = a?.role === "admin" || state.currentUserId?.toLowerCase() === "admin";
  const isPromotedMember = state.members.some(
    (member) => member.id === state.currentUserId && Boolean(member.isCollector),
  );

  if (!isMasterAdmin && !isPromotedMember) return null;

  const handleRoleChange = (newRole: Role) => {
    setState((s) => ({ ...s, currentRole: newRole }));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex flex-row items-center justify-between gap-1.5 px-1 sm:px-2">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase hidden sm:inline shrink-0 pr-1">
          {isMasterAdmin ? "Admin Switcher:" : "Your Portal:"}
        </span>
        <div className="flex flex-1 justify-between gap-1.5">
          {isMasterAdmin && (
          <Button
            variant={state.currentRole === "admin" ? "default" : "ghost"}
            size="sm"
            className={`flex-1 text-[10px] xs:text-xs py-1.5 h-8 font-medium transition-all px-1 xs:px-2 ${
              state.currentRole === "admin"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => handleRoleChange("admin")}
          >
            <Shield className="h-3 w-3 xs:h-3.5 xs:w-3.5 mr-1 shrink-0" />
            <span className="truncate">Admin</span>
          </Button>
          )}
          <Button
            variant={state.currentRole === "collector" ? "default" : "ghost"}
            size="sm"
            className={`flex-1 text-[10px] xs:text-xs py-1.5 h-8 font-medium transition-all px-1 xs:px-2 ${
              state.currentRole === "collector"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => handleRoleChange("collector")}
          >
            <UserCheck className="h-3 w-3 xs:h-3.5 xs:w-3.5 mr-1 shrink-0" />
            <span className="truncate">Collector</span>
          </Button>
          <Button
            variant={state.currentRole === "member" ? "default" : "ghost"}
            size="sm"
            className={`flex-1 text-[10px] xs:text-xs py-1.5 h-8 font-medium transition-all px-1 xs:px-2 ${
              state.currentRole === "member"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            onClick={() => handleRoleChange("member")}
          >
            <User className="h-3 w-3 xs:h-3.5 xs:w-3.5 mr-1 shrink-0" />
            <span className="truncate">Member</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
