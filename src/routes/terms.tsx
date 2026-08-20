import { createFileRoute } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, CheckCircle, Phone } from 'lucide-react'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  const handleAgree = () => {
    window.location.href = '/?mode=register'
  }

  const terms = [
    "GRT യിൽ അംഗമാവാൻ 10 രജിസ്ട്രേഷൻ ഫീസ് (ഒരു ഷെയറിന് 10 വീതം) ഉണ്ടായിരിക്കുന്നതാണ്.",
    "നിശ്ചിത ഷെയർ തുക എല്ലാ അംഗങ്ങളും അതാതു മാസം 15 നകം കലക്ടറെ ഏൽപിക്കേണ്ടതാണ്.",
    "കാരണം കൂടാതെ 4 മാസത്തിൽ കൂടുതൽ നിക്ഷേപം വൈകിക്കാൻ പാടുള്ളതല്ല.",
    "കാരണം കൂടാതെ 4 മാസത്തിൽ കൂടുതൽ നിക്ഷേപം വൈകിയാൽ കമ്മിറ്റി തീരുമാന പ്രകാരം GRT യിൽ നിന്നു അംഗത്വം റദ്ദാക്കാവുന്നതാണ്.",
    "GRT യിൽ നിന്നു അംഗത്വം റദ്ദാക്കിയാൽ നിക്ഷേപ തുക ഒരു മാസത്തിനകം തിരിച്ച് നൽകുന്നതാണ്.",
    "GRT യിലെ ഏതെങ്കിലും അംഗം നാട്ടിൽ പോകുകയാണെങ്കിൽ അവരുടെ കലക്ടറെ അറിയിക്കേണ്ടതാണ്.",
    "GRTയിലെ ഏതെങ്കിലും അംഗം പ്രവാസം വിട്ടു പോകുകയാണെങ്കിൽ 45 ദിവസം മുമ്പു കമ്മിറ്റിയെ വിവരം അറിയിക്കേണ്ടതാണ്.",
    "GRTയിലെ ഏതെങ്കിലും അംഗത്തിനു നിക്ഷേപം തുടർന്നു കൊണ്ടു പോകാൻ കഴിയാതെ വരികയാണെങ്കിൽ കമ്മിറ്റിയെ വിവരം അറിയിക്കേണ്ടതാണ്. നിക്ഷേപിച്ച തുക ഒരു മാസത്തിനകം തിരിച്ചു നൽകുന്നതാണ്.",
    "നിക്ഷേപ തുക കലക്ടറെ ഏൽപിക്കുമ്പോൾ GRT ആപ്പിൽ രേഖപ്പെടുത്തി എന്ന് ഉറപ്പു വരുത്തേണ്ടതാണ്.",
    "GRTയിലെ അംഗം മരണപ്പെട്ടാൽ നിക്ഷേപ തുക അംഗത്തിന്റെ നോമിനിയെ ഏൽപിക്കുന്നതാണ്.",
    "GRT യിലൂടെ സമാഹരിച്ച തുക ഏതെങ്കിലും സംരംഭത്തിൽ നിക്ഷേപിച്ചിട്ടുണ്ടെങ്കിൽ അതിന്റെ കാലാവധി തീർന്ന ശേഷം മാത്രമേ തുക തിരികെ ലഭിക്കുകയുള്ളൂ.",
    "GRT അംഗത്വം അല്ലെങ്കിൽ ഷെയർ മറ്റൊരാളിലേക്ക് ട്രാൻസ്‌ഫർ ചെയ്യുകയാണെങ്കിൽ കമ്മിറ്റിയുടെ അറിവോടെയും പൂർണ്ണ സമ്മതത്തോടെയും ആയിരിക്കണം.",
    "അംഗത്വം മറ്റൊരാളിലേക്ക് ട്രാൻസ്‌ഫർ ചെയ്യുമ്പോൾ അതുവരെ അടച്ചതുക പുതിയ മെമ്പറിൽ നിന്ന് വാങ്ങിച്ച് കൊടുത്തുതീർക്കുകയും, തുക എവിടെയെങ്കിലും നിക്ഷേപിച്ചിട്ടുണ്ടെങ്കിൽ അതുവരെയുള്ള ലാഭവിഹിതം പഴയ മെമ്പർക്ക് അർഹതപെട്ടതും തുടർന്നുള്ള തുകയുടെ ലാഭംവിഹിതം പുതിയമെമ്പർക്കും അർഹതപെട്ടതായിരിക്കും.",
    "GRT- ന്റെ പുരോഗതിക്ക് എല്ലാ അംഗങ്ങളുടെയും സഹായ സഹകരണങ്ങൾ ആവശ്യമാണ്."
  ]

  const contacts = [
    { title: "ചെയർമാൻ", name: "മുസ്തഫ K.S", phone: "+974 5586 3223" },
    { title: "കൺവീനർ", name: "ഇസ്മായിൽ കല്ലൻ", phone: "+974 3320 6997" },
    { title: "ട്രഷറർ", name: "അബ്ദുൽ അസീസ്", phone: "+974 3300 5515" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4 py-10 flex items-center justify-center">
      <Card className="mx-auto max-w-3xl p-6 md:p-10 border-emerald-100 shadow-xl bg-white/90 backdrop-blur-sm rounded-3xl">
        <div className="flex flex-col md:flex-row items-center gap-5 border-b border-emerald-100 pb-6 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shrink-0">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Grow Rich Together (GRT)</h1>
            <p className="text-emerald-700 font-semibold text-lg">അംഗങ്ങൾക്കുള്ള നിയമാവലികളും നിർദ്ദേശങ്ങളും</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
            <p className="text-slate-800 leading-relaxed font-medium text-[15px]">
              പ്രവാസ ജീവിതം നയിക്കുന്ന കേരളത്തിലെ വിവിധ ജില്ലകളിലെ വ്യക്തികളുടെ കൂട്ടായ്മയും സാമ്പത്തിക ഭദ്രതയും ലക്ഷ്യമാക്കി രൂപീകരിച്ചതാണ് Grow Rich Together (GRT) നിക്ഷേപ പദ്ധതി.
            </p>
            <p className="text-slate-700 mt-4 text-sm font-medium">
              താഴെ പറയുന്ന വ്യവസ്ഥകളും നിബന്ധനകളും അടിസ്ഥാനമാക്കിയായിരിക്കും പദ്ധതിയുടെ പ്രവർത്തനം:
            </p>
          </div>

          <div className="grid gap-4 mt-6">
            {terms.map((term, index) => (
              <div 
                key={index} 
                className="group flex gap-4 p-4 md:p-5 bg-white hover:bg-emerald-50/80 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 group-hover:bg-emerald-500 group-hover:text-white text-emerald-700 font-bold text-sm transition-colors duration-300">
                  {index + 1}
                </div>
                <div className="text-slate-700 leading-relaxed pt-1 text-[15px]">
                  {term}
                </div>
              </div>
            ))}
          </div>
          
          {/* Contact Section */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">ബന്ധപ്പെടേണ്ട നമ്പറുകൾ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contacts.map((contact, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-4 flex flex-col items-center text-center border border-slate-100 hover:border-emerald-200 transition-colors">
                  <span className="text-emerald-600 font-semibold text-sm mb-1">{contact.title}</span>
                  <span className="text-slate-900 font-bold mb-2">{contact.name}</span>
                  <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 text-sm font-medium">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-sm text-slate-500 font-medium text-center sm:text-left">
            മുകളിൽ പറഞ്ഞ വ്യവസ്ഥകളും നിബന്ധനകളും ഞാൻ അംഗീകരിക്കുന്നു.
          </p>
          <Button
            onClick={handleAgree}
            className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold px-8 py-6 rounded-xl flex items-center justify-center gap-2 text-base"
          >
            <CheckCircle className="h-5 w-5" />
            സമ്മതിക്കുന്നു (I Agree)
          </Button>
        </div>
      </Card>
    </div>
  )
}