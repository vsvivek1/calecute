/**
 * /agents/terms — the terms an applicant accepts at signup.
 *
 * The version here MUST match a row in `terms_versions`, because the signup
 * endpoint records which version was accepted and rejects an unknown one. When
 * these change, add a new row and bump the constant — never edit in place, or
 * the record of what someone agreed to becomes false.
 *
 * Clause 6 (duplicate PAN, forfeiture) is required to appear here by the brief,
 * because the signup form warns about it and an agent who loses accrued
 * commission must have been told in the terms they ticked.
 */
import type { Metadata } from "next";
import { Bi, En, Ml } from "@/components/agents/Bilingual";
import { Clause, LegalPage } from "@/components/agents/LegalPage";
import { company } from "@/lib/agents/content";

export const metadata: Metadata = {
  title: "നിബന്ധനകൾ · Agent terms",
  description:
    "Terms for the Calecute Technologies commission agent programme in Kerala.",
  alternates: { canonical: "/agents/terms" },
};

/** Must match a row in terms_versions. See the note above. */
const VERSION = "2026-09-01";

export default function AgentTermsPage() {
  return (
    <LegalPage
      titleMl="ഏജന്റ് നിബന്ധനകൾ"
      titleEn="Commission agent terms"
      version={VERSION}
      updated="1 September 2026"
    >
      <Bi
        text={{
          ml: `ഈ നിബന്ധനകൾ ${company.legalName.ml} ("കമ്പനി") യുടെ കമ്മീഷൻ ഏജന്റ് പദ്ധതിക്ക് ബാധകമാണ്. രജിസ്റ്റർ ചെയ്യുമ്പോൾ നിങ്ങൾ ഇവ അംഗീകരിക്കുന്നു.`,
          en: `These terms govern the commission agent programme operated by ${company.legalName.en}${company.cin ? `, CIN ${company.cin}` : ""} ("the Company"). You accept them when you register.`,
        }}
      />

      <Clause
        n={1}
        headingMl="ഇത് ജോലിയല്ല"
        headingEn="This is not employment"
      >
        <Bi
          text={{
            ml: "നിങ്ങൾ ഒരു സ്വതന്ത്ര കമ്മീഷൻ ഏജന്റാണ്. ജീവനക്കാരനല്ല. ശമ്പളമോ പിഎഫോ ഗ്രാറ്റുവിറ്റിയോ മറ്റ് ജോലി ആനുകൂല്യങ്ങളോ ഇല്ല. സ്വന്തം നികുതിക്ക് നിങ്ങൾ ഉത്തരവാദിയാണ്.",
            en: "You act as an independent commission agent, not an employee. There is no salary, provident fund, gratuity or other employment benefit, and you are responsible for your own taxes. Nothing in these terms creates a partnership or an employment relationship.",
          }}
        />
      </Clause>

      <Clause n={2} headingMl="കമ്മീഷൻ" headingEn="Commission">
        <ul>
          <Bi
            as="li"
            text={{
              ml: "നിങ്ങൾ പരിചയപ്പെടുത്തിയ ഉപഭോക്താവ് അടയ്ക്കുന്ന ഓരോ തുകയുടെയും 10%.",
              en: "10% of every payment the referred customer makes.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "ജിഎസ്ടിയും പേയ്‌മെന്റ് ഗേറ്റ്‌വേ ചാർജുകളും കിഴിച്ച ശേഷമുള്ള തുകയിലാണ് കണക്കാക്കുന്നത്.",
              en: "Calculated on the amount net of GST and payment gateway charges.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "ആ ഉപഭോക്താവ് പണം അടച്ചുകൊണ്ടിരിക്കുന്ന കാലത്തോളം ലഭിക്കും.",
              en: "Payable for as long as that customer keeps paying.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "മാസം തോറും നൽകും.",
              en: "Paid monthly.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "ആദായനികുതി നിയമം സെക്ഷൻ 194H പ്രകാരം 2% ടിഡിഎസ് കുറയ്ക്കും. ഫോം 16A ലഭ്യമാക്കും.",
              en: "TDS of 2% is deducted under Section 194H of the Income Tax Act, 1961. Form 16A is issued for each financial year.",
            }}
          />
        </ul>
        <Bi
          text={{
            ml: "എത്ര വരുമാനം ലഭിക്കുമെന്ന് കമ്പനി ഉറപ്പുനൽകുന്നില്ല.",
            en: "The Company makes no representation or guarantee about the amount you will earn.",
          }}
        />
      </Clause>

      <Clause n={3} headingMl="പണം ലഭിക്കാൻ" headingEn="Getting paid">
        <Bi
          text={{
            ml: "പണം നൽകുന്നതിന് മുൻപ് പാൻ നൽകി പരിശോധന പൂർത്തിയാക്കണം, മൊബൈൽ നമ്പർ സ്ഥിരീകരിക്കണം, ബാങ്ക് അല്ലെങ്കിൽ യുപിഐ വിവരങ്ങൾ നൽകണം. അതുവരെ കമ്മീഷൻ അക്കൗണ്ടിൽ കൂടിക്കൊണ്ടിരിക്കും, നഷ്ടപ്പെടില്ല.",
            en: "Before any payout you must supply a PAN and have it verified, confirm your mobile number, and provide bank or UPI details. Until then commission continues to accrue and is not lost.",
          }}
        />
        <Bi
          text={{
            ml: "രജിസ്റ്റർ ചെയ്യാൻ ഫീസോ നിക്ഷേപമോ ഇല്ല. ഒന്നും വാങ്ങേണ്ടതില്ല.",
            en: "There is no registration fee, deposit or purchase requirement at any stage.",
          }}
        />
      </Clause>

      <Clause n={4} headingMl="ഉപഭോക്താവ് ആരുടേത്" headingEn="Which agent a customer belongs to">
        <Bi
          text={{
            ml: "ഒരു ഉപഭോക്താവ് ആദ്യം ഏത് ഏജന്റ് കോഡ് ഉപയോഗിച്ചോ ആ ഏജന്റിന്റേതായിരിക്കും. അത് പിന്നീട് മാറ്റാൻ കഴിയില്ല. എല്ലാ അവകാശവാദങ്ങളും — സ്വീകരിച്ചതും നിരസിച്ചതും — രേഖപ്പെടുത്തുന്നു.",
            en: "A customer is attributed to the first agent code used, and that attribution is permanent and cannot be reassigned. Every attribution attempt, accepted or rejected, is logged so any dispute is settled from the record.",
          }}
        />
      </Clause>

      <Clause n={5} headingMl="സ്ഥാനങ്ങൾ" headingEn="Places per panchayat">
        <Bi
          text={{
            ml: "ഓരോ പഞ്ചായത്തിലും മുനിസിപ്പാലിറ്റിയിലും സാധാരണയായി പത്ത് ഏജന്റുമാർ. ഈ എണ്ണം കമ്പനിക്ക് മാറ്റാം. അപേക്ഷ സ്വീകരിക്കണോ എന്നത് കമ്പനിയുടെ തീരുമാനമാണ്.",
            en: "Each panchayat, municipality or corporation ordinarily holds ten agents. The Company may vary that number, and may accept or decline any application at its discretion.",
          }}
        />
      </Clause>

      <Clause
        n={6}
        headingMl="ഒരാൾക്ക് ഒരു അക്കൗണ്ട് മാത്രം"
        headingEn="One account per person"
      >
        {/* Required to appear here by the brief: the signup form warns about
            this, and an agent who loses accrued commission must have been told
            in the terms they accepted. */}
        <Bi
          text={{
            ml: "ഒരു മൊബൈൽ നമ്പറിന് ഒരു അക്കൗണ്ട്. ഒരു പാൻ നമ്പറിന് ഒരു അക്കൗണ്ട്.",
            en: "One account per mobile number, and one account per PAN.",
          }}
        />
        <Bi
          text={{
            ml: "ഒരേ പാൻ ഉപയോഗിച്ച് ഒന്നിലധികം അക്കൗണ്ടുകൾ കണ്ടെത്തിയാൽ, ആദ്യത്തേത് ഒഴികെ ബാക്കിയുള്ളവ റദ്ദാക്കും. ആ അക്കൗണ്ടുകളിൽ അതുവരെ കൂടിയ കമ്മീഷൻ നഷ്ടപ്പെടും.",
            en: "Where several accounts are found to share a PAN, all but the first are cancelled and any commission accrued on the cancelled accounts is forfeited.",
          }}
        />
      </Clause>

      <Clause n={7} headingMl="നിങ്ങൾ ചെയ്യരുതാത്തത്" headingEn="What you must not do">
        <ul>
          <Bi
            as="li"
            text={{
              ml: "കമ്പനിയോ ഉൽപ്പന്നങ്ങളോ കുറിച്ച് തെറ്റായ വാഗ്ദാനങ്ങൾ നൽകരുത്. പ്രത്യേകിച്ച് വരുമാന ഉറപ്പുകൾ.",
              en: "Make no promise about the Company or its products that the Company has not made, and never guarantee anyone an income.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "ഉപഭോക്താക്കളിൽ നിന്ന് കമ്പനിക്ക് വേണ്ടി പണം വാങ്ങരുത്.",
              en: "Do not collect money from customers on the Company's behalf.",
            }}
          />
          <Bi
            as="li"
            text={{
              ml: "കമ്പനിയുടെ പേരിൽ കരാറുകളിൽ ഒപ്പിടരുത്.",
              en: "Do not enter into agreements in the Company's name.",
            }}
          />
        </ul>
      </Clause>

      <Clause n={8} headingMl="അവസാനിപ്പിക്കൽ" headingEn="Ending the arrangement">
        <Bi
          text={{
            ml: "എപ്പോൾ വേണമെങ്കിലും നിങ്ങൾക്ക് പിൻവാങ്ങാം. ഈ നിബന്ധനകൾ ലംഘിച്ചാൽ കമ്പനിക്കും അവസാനിപ്പിക്കാം. അതുവരെ ന്യായമായി നേടിയ കമ്മീഷൻ നൽകും — ക്ലോസ് 6 പ്രകാരം റദ്ദാക്കിയ കേസുകളിൽ ഒഴികെ.",
            en: "You may withdraw at any time. The Company may end the arrangement if these terms are breached. Commission properly earned up to that point remains payable, except where an account is cancelled under clause 6.",
          }}
        />
      </Clause>

      <Clause n={9} headingMl="മാറ്റങ്ങൾ" headingEn="Changes">
        <Bi
          text={{
            ml: "നിബന്ധനകൾ മാറ്റിയാൽ പുതിയ പതിപ്പ് നമ്പർ നൽകും. നിങ്ങൾ അംഗീകരിച്ച പതിപ്പ് ഏതാണെന്ന് ഞങ്ങൾ രേഖപ്പെടുത്തുന്നു.",
            en: "Changed terms are published under a new version number. The version you accepted is recorded against your account, with the date and time.",
          }}
        />
      </Clause>

      <Clause n={10} headingMl="ബാധകമായ നിയമം" headingEn="Governing law">
        <Bi
          text={{
            ml: "ഇന്ത്യൻ നിയമം ബാധകം. കോഴിക്കോട് കോടതികൾക്കാണ് അധികാരപരിധി.",
            en: "These terms are governed by the laws of India, and the courts at Kozhikode, Kerala have exclusive jurisdiction.",
          }}
        />
        <p className="chips-note">
          <En>
            Where the Malayalam and English texts differ, the English text
            governs.
          </En>
        </p>
      </Clause>

      <Clause n={11} headingMl="ബന്ധപ്പെടാൻ" headingEn="Contact">
        <p>
          <Ml>പരാതികൾക്കും ചോദ്യങ്ങൾക്കും വാട്‌സ്ആപ്പിൽ ബന്ധപ്പെടുക.</Ml>
          <En>
            Questions and complaints: WhatsApp, or {company.email}. We aim to
            respond within seven working days.
          </En>
        </p>
      </Clause>
    </LegalPage>
  );
}
