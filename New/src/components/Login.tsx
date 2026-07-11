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
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [collector, setCollector] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeAddress, setNomineeAddress] = useState("");
  const [nomineeContact, setNomineeContact] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = login(isRegistering ? name : inputId, password, mobile, whatsapp, collector, nomineeName, nomineeAddress, nomineeContact);
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
              {isRegistering ? "SIGN IN TO JOIN" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter your ID and Password.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {!isRegistering && (
                <div>
                  <Label htmlFor="inputId">Member ID</Label>
                  <Input
                    id="inputId"
                    type="text"
                    placeholder="202601"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    required
                  />
                </div>
              )}
              {!isRegistering && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              {isRegistering && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password">Password (for new account)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      placeholder="+974..."
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                   <div>
                     <Label htmlFor="whatsapp">WhatsApp Number</Label>
                     <Input
                       id="whatsapp"
                       placeholder="+974..."
                       value={whatsapp}
                       onChange={(e) => setWhatsapp(e.target.value)}
                       required
                     />
                   </div>
                   <div className="border-t pt-4 mt-4">
                     <h3 className="font-semibold text-slate-900 mb-3">Nominee Information</h3>
                     <div>
                       <Label htmlFor="nomineeName">Nominee Full Name</Label>
                       <Input
                         id="nomineeName"
                         placeholder="Nominee Name"
                         value={nomineeName}
                         onChange={(e) => setNomineeName(e.target.value)}
                         required
                       />
                     </div>
                     <div className="mt-3">
                       <Label htmlFor="nomineeAddress">Nominee Address</Label>
                       <Input
                         id="nomineeAddress"
                         placeholder="Nominee Address"
                         value={nomineeAddress}
                         onChange={(e) => setNomineeAddress(e.target.value)}
                         required
                       />
                     </div>
                     <div className="mt-3">
                       <Label htmlFor="nomineeContact">Nominee Contact Number</Label>
                       <Input
                         id="nomineeContact"
                         placeholder="+974..."
                         value={nomineeContact}
                         onChange={(e) => setNomineeContact(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                 </div>
               )}
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isRegistering ? "Register" : "Sign In"}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-emerald-600 hover:underline"
                >
                  {isRegistering ? "Already have an account? Sign in" : "Need an account? Sign up"}
                </button>
              </div>

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

            <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <strong>Demo tips:</strong> try{" "}
              <code className="font-mono">MEM001</code> (member) or{" "}
              <code className="font-mono">ADM_ALI</code> (admin). Or use
              the dev switcher in the corner.
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
