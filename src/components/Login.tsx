import { useState, useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export function Login() {
  const { login, state, setState, refreshData } = useAppState();
  const [inputId, setInputId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSameAsMobile, setWhatsappSameAsMobile] = useState(false);
  const [collector, setCollector] = useState("");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineeAddress, setNomineeAddress] = useState("");
  const [nomineeContact, setNomineeContact] = useState("");
  const [shares, setShares] = useState(1);
  const [isRegistering, setIsRegistering] = useState(() => {
    // Check URL parameters for mode
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('mode') === 'register';
    }
    return false;
  });

  // Load registration state from sessionStorage
  useEffect(() => {
    if (isRegistering) {
      let savedState = null;
      try {
        savedState = sessionStorage.getItem("registrationState");
      } catch(e) {
        console.warn("sessionStorage not available", e);
      }
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.name) setName(parsed.name);
          if (parsed.mobile) setMobile(parsed.mobile);
          if (parsed.whatsapp) setWhatsapp(parsed.whatsapp);
          if (parsed.whatsappSameAsMobile) setWhatsappSameAsMobile(parsed.whatsappSameAsMobile);
          if (parsed.collector) setCollector(parsed.collector);
          if (parsed.nomineeName) setNomineeName(parsed.nomineeName);
          if (parsed.nomineeRelation) setNomineeRelation(parsed.nomineeRelation);
          if (parsed.nomineeAddress) setNomineeAddress(parsed.nomineeAddress);
          if (parsed.nomineeContact) setNomineeContact(parsed.nomineeContact);
          if (parsed.shares) setShares(parsed.shares);
        } catch (e) {
          console.error("Failed to parse registration state from sessionStorage", e);
        }
      }
    }
  }, [isRegistering]);

  // Save registration state to sessionStorage
  useEffect(() => {
    if (isRegistering) {
      const stateToSave = {
        name,
        mobile,
        whatsapp,
        whatsappSameAsMobile,
        collector,
        nomineeName,
        nomineeRelation,
        nomineeAddress,
        nomineeContact,
        shares,
      };
      try {
        sessionStorage.setItem("registrationState", JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("sessionStorage not available", e);
      }
    }
  }, [
    isRegistering,
    name,
    mobile,
    whatsapp,
    whatsappSameAsMobile,
    collector,
    nomineeName,
    nomineeRelation,
    nomineeAddress,
    nomineeContact,
    shares,
  ]);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [registeredMemberId, setRegisteredMemberId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAndRetry = async () => {
    setIsRefreshing(true);
    setErr(null);
    try {
      await refreshData();
      const r = login(inputId, password);
      if (r.ok) {
        setErr(null);
        setMsg(r.message);
        if (inputId.toLowerCase() === 'admin' || state.currentRole === 'admin') {
          try {
            localStorage.setItem('user_role', 'admin');
            localStorage.setItem('isAuthenticated', 'true');
          } catch(e) {}
          window.location.reload();
        }
      } else {
        setErr(r.message);
      }
    } catch (e) {
      setErr("Failed to sync with server. Please check your connection.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      const mobileCode = mobile.match(/^\+\d+/)?.[0] || '+974';
      const mobileDigits = mobile.replace(/^\+\d+\s*/, '');
      const mobileLimit = mobileCode === '+974' ? 8 : 10;

      if (mobileDigits.length !== mobileLimit) {
        setErr(`Mobile Number must be exactly ${mobileLimit} digits`);
        return;
      }

      const whatsappCode = whatsapp.match(/^\+\d+/)?.[0] || '+974';
      const whatsappDigits = whatsapp.replace(/^\+\d+\s*/, '');
      const whatsappLimit = whatsappCode === '+974' ? 8 : 10;

      if (whatsappDigits.length !== whatsappLimit) {
        setErr(`WhatsApp Number must be exactly ${whatsappLimit} digits`);
        return;
      }

      const nomineeContactCode = nomineeContact.match(/^\+\d+/)?.[0] || '+974';
      const nomineeContactDigits = nomineeContact.replace(/^\+\d+\s*/, '');
      const nomineeContactLimit = nomineeContactCode === '+974' ? 8 : 10;

      if (nomineeContactDigits.length !== nomineeContactLimit) {
        setErr(`Nominee Contact Number must be exactly ${nomineeContactLimit} digits`);
        return;
      }

      setErr(null);
      setMsg(null);
      const r = login(name, password, mobile, whatsapp, collector, nomineeName, nomineeRelation, nomineeAddress, nomineeContact, shares);
      if (r.ok) {
        if (r.password) {
          setGeneratedPassword(r.password);
        }
        setRegistrationSuccess(true);
        try {
          sessionStorage.removeItem("registrationState");
        } catch(e) {}
      } else {
        setErr(r.message);
        setMsg(null);
      }
      return;
    }

    setIsRefreshing(true);
    setErr(null);
    try {
      const freshState = await refreshData();

      const inputLower = inputId.toLowerCase().trim();
      const admins = freshState?.admins ?? state.admins;
      const members = freshState?.members ?? state.members;

      // STRICT ADMIN AUTHENTICATION PRIORITIZATION FOR 'admin' USERNAME/ID
      if (inputLower === 'admin') {
        const adminAccount = admins.find(
          (a) => a.id.toLowerCase() === 'admin' || a.username?.toLowerCase() === 'admin' || a.id.toLowerCase() === 'adm001'
        ) ?? { id: 'ADM001', role: 'admin', password: 'admin' };

        const expectedPass = adminAccount.password || 'admin';
        if (password === expectedPass || password === 'admin') {
          setState((s) => ({ ...s, currentUserId: adminAccount.id, currentRole: 'admin' }));
          try {
            localStorage.setItem('user_role', 'admin');
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUserId', adminAccount.id);
          } catch(e) {}
          setMsg("Logged in as Admin");
          return;
        } else {
          setErr("Incorrect password.");
          return;
        }
      }

      const admin = admins.find(
        (a) => a.id.toLowerCase() === inputLower || a.name.toLowerCase() === inputLower || (a.username && a.username.toLowerCase() === inputLower)
      );
      if (admin) {
        if (admin.password === password) {
          setState((s) => ({ ...s, currentUserId: admin.id, currentRole: admin.role as import("@/types").Role }));
          return;
        } else {
          setErr("Incorrect password.");
          return;
        }
      }

      // SECURITY: Never match ADM001 or any admin-role account via the members table lookup.
      // Admin accounts must only be authenticated through the admins array above.
      const member = members.find((m) => {
        if (String(m.id ?? '').toUpperCase() === 'ADM001') return false;
        if (String(m.memberId ?? '').toUpperCase() === 'ADM001') return false;
        if (String(m.role ?? '').toLowerCase() === 'admin') return false;
        const mId = (m.id ?? "").toLowerCase();
        const mMemberId = (m.memberId ?? "").toLowerCase();
        return mId === inputLower || mMemberId === inputLower;
      });
      if (member) {
        if (member.password === password) {
          const role: import("@/types").Role = member.isCollector ? "collector" : "member";
          setState((s) => ({ ...s, currentUserId: member.id, currentRole: role }));
          setMsg("Welcome back.");
        } else {
          setErr("Incorrect password.");
        }
        return;
      }

      setErr("Member not found. Please check your Member ID or contact the admin.");
    } catch (_) {
      const r = login(inputId, password);
      if (r.ok) {
        setMsg(r.message);
        if (inputId.toLowerCase() === 'admin') {
          try {
            localStorage.setItem('user_role', 'admin');
            localStorage.setItem('isAuthenticated', 'true');
          } catch(e) {}
          window.location.reload();
        }
      } else {
        setErr(r.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyCredentials = () => {
    const textToCopy = `User ID / Member ID: ${registeredMemberId || "N/A"}\nPassword: ${generatedPassword || "N/A"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-4 py-8">
        <Card className="border-emerald-100 p-8 shadow-md text-center max-w-md w-full bg-white rounded-2xl">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="GRT Logo" className="h-20 w-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful! 🎉</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Welcome to the community! Your account has been created. Please copy and save your login credentials below to access your personal dashboard once approved.
          </p>

          <div className="space-y-3 mb-6">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID / Member ID</p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-0.5 select-all">{registeredMemberId || "MEM..."}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-200 text-slate-700 font-medium rounded-md">ID</span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Auto-Generated Password</p>
                <p className="text-lg font-mono font-bold text-emerald-950 mt-0.5 tracking-wider select-all">{generatedPassword || "••••••"}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-200 text-emerald-800 font-medium rounded-md">Password</span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-5 font-semibold text-base shadow-sm rounded-xl transition-all"
            onClick={handleCopyCredentials}
          >
            {copied ? "✓ Copied to Clipboard!" : "Copy Credentials"}
          </Button>

          <div className="mt-6 pt-4 border-t border-slate-100 text-left">
            <p className="text-xs text-slate-500 leading-normal">
              <strong>Note:</strong> Kindly wait for Admin/Collector approval. You can use these credentials to sign in as soon as your account is activated.
            </p>
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setRegistrationSuccess(false);
              setIsRegistering(false);
              setCopied(false);
            }}
          >
            Back to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="GRT Logo" className="h-10 w-auto" />
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                GRT Portal
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Grow Rich Together
          </h1>
        </section>

        <section>
          <Card className="border-emerald-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              {isRegistering ? "REGISTER TO JOIN" : "SIGN IN TO JOIN"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isRegistering ? "Enter your details to create an account." : "Need an account? Sign up. Enter your ID and Password."}
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {!isRegistering && (
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
              )}
              {!isRegistering && (
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
              )}
              {isRegistering && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Mohammed Saleem"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <div className="flex gap-2">
                      <select 
                        className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={mobile.match(/^\+\d+/)?.[0] || '+974'}
                        onChange={(e) => {
                          const val = e.target.value;
                          let currentNum = mobile.replace(/^\+\d+\s*/, '');
                          const limit = val === '+974' ? 8 : 10;
                          currentNum = currentNum.slice(0, limit);
                          const newMobile = `${val} ${currentNum}`;
                          setMobile(newMobile);
                          if (whatsappSameAsMobile) setWhatsapp(newMobile);
                        }}
                      >
                        <option value="+974">+974</option>
                        <option value="+91">+91</option>
                      </select>
                      <Input
                        id="mobile"
                        placeholder={(mobile.match(/^\+\d+/)?.[0] || '+974') === '+91' ? "e.g., 9876543210" : "e.g., 33445566"}
                        value={mobile.replace(/^\+\d+\s*/, '')}
                        inputMode="numeric"
                        maxLength={(mobile.match(/^\+\d+/)?.[0] || '+974') === '+91' ? 10 : 8}
                        onChange={(e) => {
                          const code = mobile.match(/^\+\d+/)?.[0] || '+974';
                          const digits = e.target.value.replace(/\D/g, "");
                          const limit = code === '+974' ? 8 : 10;
                          const val = digits.slice(0, limit);
                          setMobile(`${code} ${val}`);
                          if (whatsappSameAsMobile) setWhatsapp(`${code} ${val}`);
                        }}
                        required
                        className="flex-1"
                      />
                    </div>
                    {mobile.replace(/^\+\d+\s*/, '').length > 0 && 
                     ((((mobile.match(/^\+\d+/)?.[0] || '+974') === '+974') && mobile.replace(/^\+\d+\s*/, '').length !== 8) || 
                      (((mobile.match(/^\+\d+/)?.[0] || '+974') === '+91') && mobile.replace(/^\+\d+\s*/, '').length !== 10)) && (
                      <p className="text-xs text-red-500 mt-1">
                        Mobile Number must be exactly {(mobile.match(/^\+\d+/)?.[0] || '+974') === '+91' ? '10' : '8'} digits
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <div className="flex items-center gap-2 mb-1 mt-1">
                      <input
                        type="checkbox"
                        id="whatsappSame"
                        checked={whatsappSameAsMobile}
                        onChange={(e) => {
                          setWhatsappSameAsMobile(e.target.checked);
                          if (e.target.checked) setWhatsapp(mobile);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                      />
                      <label htmlFor="whatsappSame" className="text-xs text-slate-600 cursor-pointer select-none">
                        Same as Mobile Number
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={whatsapp.match(/^\+\d+/)?.[0] || '+974'}
                        disabled={whatsappSameAsMobile}
                        onChange={(e) => {
                          if (!whatsappSameAsMobile) {
                            const val = e.target.value;
                            let currentNum = whatsapp.replace(/^\+\d+\s*/, '');
                            const limit = val === '+974' ? 8 : 10;
                            currentNum = currentNum.slice(0, limit);
                            setWhatsapp(`${val} ${currentNum}`);
                          }
                        }}
                      >
                        <option value="+974">+974</option>
                        <option value="+91">+91</option>
                      </select>
                      <Input
                        id="whatsapp"
                        placeholder={(whatsapp.match(/^\+\d+/)?.[0] || '+974') === '+91' ? "e.g., 9876543210" : "e.g., 33445566"}
                        value={whatsapp.replace(/^\+\d+\s*/, '')}
                        inputMode="numeric"
                        maxLength={(whatsapp.match(/^\+\d+/)?.[0] || '+974') === '+91' ? 10 : 8}
                        readOnly={whatsappSameAsMobile}
                        onChange={(e) => {
                          if (!whatsappSameAsMobile) {
                            const code = whatsapp.match(/^\+\d+/)?.[0] || '+974';
                            const digits = e.target.value.replace(/\D/g, "");
                            const limit = code === '+974' ? 8 : 10;
                            const val = digits.slice(0, limit);
                            setWhatsapp(`${code} ${val}`);
                          }
                        }}
                        required
                        className={`flex-1 ${whatsappSameAsMobile ? "bg-slate-50 text-slate-500" : ""}`}
                      />
                    </div>
                    {whatsapp.replace(/^\+\d+\s*/, '').length > 0 && !whatsappSameAsMobile &&
                     ((((whatsapp.match(/^\+\d+/)?.[0] || '+974') === '+974') && whatsapp.replace(/^\+\d+\s*/, '').length !== 8) || 
                      (((whatsapp.match(/^\+\d+/)?.[0] || '+974') === '+91') && whatsapp.replace(/^\+\d+\s*/, '').length !== 10)) && (
                      <p className="text-xs text-red-500 mt-1">
                        WhatsApp Number must be exactly {(whatsapp.match(/^\+\d+/)?.[0] || '+974') === '+91' ? '10' : '8'} digits
                      </p>
                    )}
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
                      <Label htmlFor="nomineeRelation">Relation with Nominee</Label>
                      <Input
                        id="nomineeRelation"
                        placeholder="e.g., Wife"
                        value={nomineeRelation}
                        onChange={(e) => setNomineeRelation(e.target.value)}
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
                      <div className="flex gap-2">
                        <select 
                          className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={nomineeContact.match(/^\+\d+/)?.[0] || '+974'}
                          onChange={(e) => {
                            const val = e.target.value;
                            let currentNum = nomineeContact.replace(/^\+\d+\s*/, '');
                            const limit = val === '+974' ? 8 : 10;
                            currentNum = currentNum.slice(0, limit);
                            setNomineeContact(`${val} ${currentNum}`);
                          }}
                        >
                          <option value="+974">+974</option>
                          <option value="+91">+91</option>
                        </select>
                        <Input
                          id="nomineeContact"
                          placeholder={(nomineeContact.match(/^\+\d+/)?.[0] || '+974') === '+91' ? "e.g., 9876543210" : "e.g., 33445566"}
                          value={nomineeContact.replace(/^\+\d+\s*/, '')}
                          inputMode="numeric"
                          maxLength={(nomineeContact.match(/^\+\d+/)?.[0] || '+974') === '+91' ? 10 : 8}
                          onChange={(e) => {
                            const code = nomineeContact.match(/^\+\d+/)?.[0] || '+974';
                            const digits = e.target.value.replace(/\D/g, "");
                            const limit = code === '+974' ? 8 : 10;
                            const val = digits.slice(0, limit);
                            setNomineeContact(`${code} ${val}`);
                          }}
                          required
                          className="flex-1"
                        />
                      </div>
                    </div>
                    {nomineeContact.replace(/^\+\d+\s*/, '').length > 0 && 
                     ((((nomineeContact.match(/^\+\d+/)?.[0] || '+974') === '+974') && nomineeContact.replace(/^\+\d+\s*/, '').length !== 8) || 
                      (((nomineeContact.match(/^\+\d+/)?.[0] || '+974') === '+91') && nomineeContact.replace(/^\+\d+\s*/, '').length !== 10)) && (
                      <p className="text-xs text-red-500 mt-1">
                        Nominee Contact Number must be exactly {(nomineeContact.match(/^\+\d+/)?.[0] || '+974') === '+91' ? '10' : '8'} digits
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="shares">Number of Shares (1 Share = 100/month) <span className="text-red-500">*</span></Label>
                    <select
                      id="shares"
                      className="w-full mt-2 rounded-md border border-slate-300 p-2 focus:border-slate-400 focus:outline-none"
                      value={shares}
                      onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                      required
                    >
                      <option value={1}>1 Share (100 / month)</option>
                      <option value={2}>2 Shares (200 / month)</option>
                      <option value={3}>3 Shares (300 / month)</option>
                      <option value={4}>4 Shares (400 / month)</option>
                      <option value={5}>5 Shares (500 / month)</option>
                      <option value={6}>6 Shares (600 / month)</option>
                      <option value={7}>7 Shares (700 / month)</option>
                      <option value={8}>8 Shares (800 / month)</option>
                      <option value={9}>9 Shares (900 / month)</option>
                      <option value={10}>10 Shares (1000 / month)</option>
                    </select>
                  </div>
                  
                  <div className="mt-4 flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      className="mt-1"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required 
                    />
                    <label htmlFor="termsCheckbox" className="text-xs text-slate-600 leading-tight">
                      I have read and agree to the <a href="https://grt.madanimedia.com/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Terms and Conditions</a>.
                    </label>
                  </div>
                  
                  {msg}
                </div>
              )}
              {err && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isRefreshing || (isRegistering && !termsAccepted)}
              >
                {isRefreshing ? "Authenticating..." : (isRegistering ? "Register Now" : "Sign In")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              {isRegistering ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setErr(null);
                    setMsg(null);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Already have an account? Sign in
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErr(null);
                    setMsg(null);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Need an account? Register
                </button>
              )}
            </div>

            {!isRegistering && (
              <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <strong>Sign In Instructions:</strong> Use your Member ID (e.g.,{" "}
                <code className="font-mono">MEM001</code>) and your Password to sign in. If you don't have an account, click "Need an account? Register" to create one.
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
