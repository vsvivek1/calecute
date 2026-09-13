# Kerala geography

Everything below district level comes from official LGD exports. Nothing is
invented — a body the loader cannot resolve is reported and skipped, and a ward
with no published name is stored as `PENDING` rather than given a plausible one.

## Current state

| Tier | Seeded | Official | |
|---|---|---|---|
| Districts | 14 | 14 | complete |
| Block panchayats | 152 | 152 | complete |
| Gram panchayats | 941 | 941 | complete |
| Municipalities | 0 | 87 | **missing** |
| Corporations | 0 | 6 | **missing** |
| Wards | 0 | — | **missing** |

Reference totals in `apps/api/data/geography/official-totals.json`, verified
2026-09-13 against the LGD export.

**Consequence of the gaps:** nobody living in a municipality or corporation can
apply — the picker has no entry for them. Wards are optional at signup, so their
absence degrades the coverage reports rather than blocking anyone.

## Finishing it

The bulk download is CAPTCHA-gated, so this cannot be automated.

1. Open <https://lgdirectory.gov.in> → **Download Directory**
2. Report: **State and District Wise Urban Local Bodies**, State: **Kerala (32)**
3. Solve the captcha, download the `.xlsx`
4. Drop it in `apps/api/data/geography/raw/`
5. `npm run geo:convert --workspace=apps/api` — extend
   `scripts/convert-lgd.mjs` to emit `MUNICIPALITY` and `CORPORATION` rows from
   it, then `npm run db:seed --workspace=apps/api`

Wards are harder: LGD does not publish them in bulk. The authority is the
Kerala State Election Commission's delimitation notification per local body.
The loader already accepts `wards.csv` with the header documented in
`scripts/fetch-geography.mjs`.

## What was used

| File | Gives |
|---|---|
| `Pri_Lb_Specific_State_*.xlsx` | Every PRI body with its LGD code, parent code, and **Malayalam name** |
| `All_Pricovered_Villages_kerala_*.xlsx` | The revenue district each gram panchayat belongs to |

Both were needed. LGD's "district panchayat" is a PRI tier, not the revenue
district the programme is organised by. They correspond one-to-one in Kerala,
but relying on that coincidence would be wrong, so the revenue district is taken
from the file that actually states it.

The 42MB all-India export is not needed and is gitignored.

## Two things worth knowing

**Chillu normalisation.** LGD writes chillu letters in the old encoding
(consonant + virama + ZWJ). A phone keyboard produces the modern atomic
characters. `convert-lgd.mjs` normalises on import — without it, `കണ്ണൂർ` typed
by a user would never match `കണ്ണൂര്‍` as stored.

**Ids are ours.** Every table has its own `bigserial` primary key, with
`lgd_code` alongside as a nullable external reference. Agent codes, API payloads
and clients all use our ids, so a re-published LGD code cannot renumber
anything. Names are never keys.

## Reading .xlsx

`scripts/lib/xlsx.mjs` is a ~160-line reader: an `.xlsx` is a ZIP of XML, and
Node has `zlib` but no ZIP reader. That was judged smaller than a spreadsheet
dependency for two files read once at seed time. It handles the first worksheet,
shared strings and blank-cell column positions, and nothing else.
