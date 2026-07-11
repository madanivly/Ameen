import { useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PublicAnalytics } from "./PublicAnalytics";
import { ShieldCheck } from "lucide-react";

export function Login() {
  const { login, state } = useAppState();
  const [inputId, setInputId] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = login(inputId, password);
    if (r.ok) {
      setMsg(r.message);
      setErr(null);
    } else {
      setErr(r.message);
      setMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                Ameen Portal
              </div>
              <div className="text-xs text-slate-500">Community Investment Fund</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Grow together.{" "}
            <span className="text-emerald-600">Invest with trust.</span>
          </h1>
          <p className="mt-3 text-slate-600">
            Ameen is a transparent community fund. Members contribute 100 monthly;
            pooled capital is deployed into vetted local businesses. Every deposit,
            transfer, and profit share is tracked in the open.
          </p>
          <div className="mt-6">
            <PublicAnalytics />
          </div>
        </section>

         <section>
           <Card className="border-emerald-100 p-6 shadow-sm">
             <h2 className="text-xl font-semibold text-slate-900">
               SIGN IN TO JOIN
             </h2>
             <p className="mt-1 text-sm text-slate-500">
               Enter your Member ID and Password to sign in.
             </p>

             <form onSubmit={submit} className="mt-5 space-y-4">
               <div>
                 <Label htmlFor="inputId">Member ID</Label>
                 <Input
                   id="inputId"
                   type="text"
                   placeholder="e.g., MEM001"
                   value={inputId}
                   onChange={(e) => setInputId(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <Label htmlFor="password">Password</Label>
                 <Input
                   id="password"
                   type="password"
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
               </div>
               <Button
                 type="submit"
                 className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
               >
                 Sign In
               </Button>

               {msg && (
                 <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                   {msg}
                 </div>
               )}
               {err && (
                 <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                   {err}
                 </div>
               )}
             </form>

             <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
               <strong>Note:</strong> Only existing members can sign in with their ID and password. To become a member, contact the Ameen Fund administration.
             </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
