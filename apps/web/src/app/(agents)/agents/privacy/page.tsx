/**
 * /agents/privacy — the privacy policy for the agent programme.
 *
 * Linked from Google's OAuth consent screen and ticked at signup. Written to
 * describe what the system actually does, which is checkable: the field list
 * matches the signup schema, the encryption claim matches lib/crypto.ts, and
 * the "no PII in analytics" claim is asserted by the smoke test.
 *
 * If the system changes, this changes. A policy that describes something else
 * is worse than none.
 */
import type { Metadata } from "next";
import { Bi, En, Ml } from "@/components/agents/Bilingual";
import { Clause, LegalPage } from "@/components/agents/LegalPage";
import { company } from "@/lib/agents/content";

export const metadata: Metadata = {
  title: "സ്വകാര്യതാ നയം · Privacy",
  description:
    "How Calecute Technologies handles the personal data of commission agents in Kerala.",
  alternates: { canonical: "/agents/privacy" },
};

export default function AgentPrivacyPage() {
  return (
    <LegalPage
      titleMl="സ്വകാര്യതാ നയം"
      titleEn="Privacy policy"
      updated="13 September 2026"
    >
      <Bi
        text={{
          ml: `${company.legalName.ml} ആണ് ഈ വിവരങ്ങളുടെ ഉത്തരവാദി. ഡിജിറ്റൽ പേഴ്‌സണൽ ഡാറ്റ പ്രൊട്ടക്ഷൻ ആക്റ്റ് 2023 പ്രകാരമാണ് ഇത് തയ്യാറാക്കിയത്.`,
          en: `${company.legalName.en} is the data fiduciary for the commission agent programme. This policy is written under the Digital Personal Data Protection Act, 2023.`,
        }}
      />

      <Clause n={1} headingMl="എന്തൊക്കെ ശേഖരിക്കുന്നു" headingEn="What we collect">
        <Bi
          text={{
            ml: "രജിസ്റ്റർ ചെയ്യുമ്പോൾ: പേര്, മൊബൈൽ നമ്പർ, ജില്ല, പഞ്ചായത്ത്, വാർഡ്, ഇപ്പോഴത്തെ ജോലി. ഗൂഗിൾ സൈൻ ഇന്നിൽ നിന്ന്: ഇമെയിൽ വിലാസവും പേരും.",
            en: "At signup: your name, mobile number, district, panchayat, ward and occupation. From Google Sign-In: your email address, name and account identifier. Nothing else is requested from Google.",
          }}
        />
        <Bi
          text={{
            ml: "ഐച്ഛികം: വിദ്യാഭ്യാസം, മുൻപരിചയം, ലഭ്യമായ സമയം, വാഹനം, കമ്പ്യൂട്ടർ പരിചയം, ആരുമായി ബന്ധപ്പെടാൻ കഴിയും. ഇവ നൽകാതെയും രജിസ്റ്റർ ചെയ്യാം.",
            en: "Optionally: education, previous experience, hours available, whether you have a vehicle, computer literacy and who you can reach. You can register without answering any of these.",
          }}
        />
        <Bi
          text={{
            ml: "പണം പിൻവലിക്കുമ്പോൾ മാത്രം: പാൻ, ബാങ്ക് അക്കൗണ്ട് അല്ലെങ്കിൽ യുപിഐ. രജിസ്റ്റർ ചെയ്യുമ്പോൾ ഇവ ചോദിക്കില്ല.",
            en: "Only when you set up payouts: your PAN and bank or UPI details. These are never requested at signup.",
          }}
        />
        <Bi
          text={{
            ml: "ജനനത്തീയതി, വിലാസം, ഫോട്ടോ, രേഖകൾ — ഇവയൊന്നും ശേഖരിക്കുന്നില്ല.",
            en: "We do not collect your date of birth, address, photograph or any uploaded document.",
          }}
        />
      </Clause>

      <Clause n={2} headingMl="എന്തിന് ഉപയോഗിക്കുന്നു" headingEn="Why we use it">
        <Bi
          text={{
            ml: "അപേക്ഷ പരിശോധിക്കാൻ, ഏജന്റ് കോഡ് നൽകാൻ, കമ്മീഷൻ കണക്കാക്കി നൽകാൻ, ടിഡിഎസ് ഫയൽ ചെയ്യാൻ, നിങ്ങളുമായി ബന്ധപ്പെടാൻ. മറ്റൊന്നിനും ഉപയോഗിക്കില്ല.",
            en: "To assess your application, issue an agent code, calculate and pay commission, meet our tax obligations, and contact you about the programme. We do not use it for anything else.",
          }}
        />
        <Bi
          text={{
            ml: "നിങ്ങളുടെ വിവരങ്ങൾ ഞങ്ങൾ വിൽക്കുന്നില്ല. പരസ്യത്തിനോ പ്രൊഫൈലിംഗിനോ ഉപയോഗിക്കുന്നില്ല.",
            en: "We do not sell your data, and we do not use it for advertising or profiling.",
          }}
        />
      </Clause>

      <Clause n={3} headingMl="പാൻ എങ്ങനെ സൂക്ഷിക്കുന്നു" headingEn="How your PAN is protected">
        <Bi
          text={{
            ml: "പാൻ എൻക്രിപ്റ്റ് ചെയ്താണ് സൂക്ഷിക്കുന്നത്. സ്ക്രീനിൽ XXXXX1234F എന്ന രീതിയിൽ മാത്രമേ കാണിക്കൂ — നിങ്ങൾക്കും അഡ്മിനും.",
            en: "Your PAN is encrypted at rest with AES-256-GCM. It is displayed only as a mask such as XXXXX1234F — to you, to administrators, and in every export. No part of this system returns a full PAN over the API.",
          }}
        />
        <Bi
          text={{
            ml: "ലോഗുകളിലോ പിശക് റിപ്പോർട്ടുകളിലോ ഓഡിറ്റ് രേഖകളിലോ പാൻ വരില്ല.",
            en: "It never appears in logs, error reports or audit entries. Duplicate accounts are detected using a one-way keyed fingerprint, so that check never decrypts anything.",
          }}
        />
      </Clause>

      <Clause n={4} headingMl="ആരൊക്കെ കാണും" headingEn="Who can see it">
        <Bi
          text={{
            ml: "നിങ്ങളുടെ ജില്ലയുടെ ചുമതലയുള്ള അഡ്മിനും കമ്പനിയിലെ അധികാരപ്പെട്ടവരും മാത്രം. മറ്റ് ഏജന്റുമാർക്ക് നിങ്ങളുടെ വിവരങ്ങൾ കാണാൻ കഴിയില്ല.",
            en: "Administrators responsible for your district, and authorised Company staff. Other agents cannot see your details. Access is enforced by the database itself, not only by the application.",
          }}
        />
        <Bi
          text={{
            ml: "നിയമപ്രകാരം ആവശ്യമായ ഘട്ടങ്ങളിൽ — ഉദാഹരണത്തിന് ആദായനികുതി വകുപ്പിന് ടിഡിഎസ് വിവരം — പങ്കിടും.",
            en: "We share data with the Income Tax Department as required for TDS returns, and with our bank to make payments. We will disclose data where the law requires it.",
          }}
        />
      </Clause>

      <Clause n={5} headingMl="എത്ര കാലം സൂക്ഷിക്കും" headingEn="How long we keep it">
        <Bi
          text={{
            ml: "അംഗീകരിക്കപ്പെടാത്ത അപേക്ഷകൾ: <<<RETENTION PERIOD>>>. കമ്മീഷനും നികുതിയും സംബന്ധിച്ച രേഖകൾ: നിയമപ്രകാരം എട്ട് വർഷം.",
            en: "Applications that are never approved: <<<RETENTION PERIOD — to be set>>>. Commission and tax records: retained for eight financial years, as Indian tax law requires, even after an account is closed.",
          }}
        />
      </Clause>

      <Clause n={6} headingMl="നിങ്ങളുടെ അവകാശങ്ങൾ" headingEn="Your rights">
        <Bi
          text={{
            ml: "നിങ്ങളെക്കുറിച്ചുള്ള വിവരങ്ങൾ ചോദിക്കാനും തിരുത്താനും മായ്ക്കാനും അവകാശമുണ്ട്. ഡാഷ്ബോർഡിൽ നിന്ന് തന്നെ ഇത് ചെയ്യാം.",
            en: "You may ask for a copy of your data, correct it, or ask us to erase it. Your dashboard does all three without needing to contact anyone.",
          }}
        />
        <Bi
          text={{
            ml: "മായ്ക്കാൻ ആവശ്യപ്പെട്ടാൽ, തിരിച്ചറിയാവുന്ന വിവരങ്ങൾ നീക്കം ചെയ്യും. കമ്മീഷൻ, നികുതി രേഖകൾ നിയമപരമായ കാലയളവ് വരെ നിലനിർത്തും.",
            en: "On an erasure request we remove your identifying details. Commission and tax records are kept for the statutory period described above, because we are required to hold them.",
          }}
        />
      </Clause>

      <Clause n={7} headingMl="ഈ വെബ്‌സൈറ്റ്" headingEn="This website">
        <Bi
          text={{
            ml: "പരസ്യ കുക്കികളില്ല. ട്രാക്കിംഗ് ഇല്ല. സൈൻ ഇൻ ചെയ്യാൻ ആവശ്യമായ കുക്കി മാത്രം.",
            en: "No advertising cookies and no third-party trackers. The only cookies are the ones that keep you signed in.",
          }}
        />
        <Bi
          text={{
            ml: "ഏത് ഘട്ടത്തിലാണ് ആളുകൾ രജിസ്ട്രേഷൻ ഉപേക്ഷിക്കുന്നത് എന്നറിയാൻ ഞങ്ങൾ കണക്കെടുക്കുന്നു. അതിൽ നിങ്ങളെ തിരിച്ചറിയാവുന്ന ഒന്നും ഉണ്ടാകില്ല.",
            en: "We measure where people abandon the signup form so we can fix it. Those measurements carry no name, email, mobile number or account identifier, and are not linked to you.",
          }}
        />
      </Clause>

      <Clause n={8} headingMl="പരാതികൾ" headingEn="Complaints">
        <p>
          <Ml>പരാതികൾ വാട്‌സ്ആപ്പിലോ ഇമെയിലിലോ അറിയിക്കാം.</Ml>
          <En>
            Contact us by WhatsApp or at {company.email}. If you are not
            satisfied, you may complain to the Data Protection Board of India.
          </En>
        </p>
      </Clause>
    </LegalPage>
  );
}
