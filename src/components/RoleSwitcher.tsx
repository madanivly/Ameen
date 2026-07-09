import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";

/**
 * Developer-only floating panel to quickly switch identity/role for testing.
 * Not part of the production experience.
 */
export function RoleSwitcher() {
  const { state, setState, resetSeed, logout } = useAppState();
  const [open, setOpen] = useState(true);

  const setUser = (id: string, role: "member" | "admin" | "collector") => {
    // Ensure that if a user is a collector, we set their role explicitly to "collector"
    // even if they also happen to be a member in the system.
    setState((s) => ({ ...s, currentUserId: id, currentRole: role }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72">
      <Card className="border-emerald-200 bg-white/95 shadow-xl backdrop-blur">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-t-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Dev · Role Switcher
          </span>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {open && (
          <div className="space-y-3 p-3 text-sm">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">
                Treasurers & Admins
              </div>
              <div className="flex flex-wrap gap-1">
                {state.admins
                  .filter((a) => a.role === "admin")
                  .map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant={state.currentUserId === a.id ? "default" : "outline"}
                      className={
                        state.currentUserId === a.id
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }
                      onClick={() => setUser(a.id, "admin")}
                    >
                      {a.name.split(" ")[0]}
                    </Button>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">
                Collectors
              </div>
              <div className="flex flex-wrap gap-1">
                {state.admins
                  .filter((a) => a.role === "collector")
                  .map((a) => (
                    <Button
                      key={a.id}
                      size="sm"
                      variant={state.currentUserId === a.id ? "default" : "outline"}
                      className={
                        state.currentUserId === a.id
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "border-sky-200 text-sky-800"
                      }
                      onClick={() => setUser(a.id, "collector")}
                    >
                      {a.name.split(" ")[0]}
                    </Button>
                  ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-500">Members</div>
              <div className="flex flex-wrap gap-1">
                {state.members
                  .filter((m) => m.role !== "collector")
                  .map((m) => (
                    <Button
                      key={m.id}
                      size="sm"
                      variant={state.currentUserId === m.id ? "default" : "outline"}
                      className={
                        state.currentUserId === m.id
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }
                      onClick={() => setUser(m.id, "member")}
                    >
                      {m.name.split(" ")[0]}
                      {!m.registrationFeePaid && " ⏳"}
                    </Button>
                  ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={logout}>
                Logout
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm("Reset all local data to seed?")) resetSeed();
                }}
              >
                Reset seed
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
