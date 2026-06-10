// Country list for address forms. Names are derived from ISO 3166-1 alpha-2 codes via the
// platform's CLDR data (Intl.DisplayNames), which matches the English names the backend resolves
// (Java Locale#getDisplayCountry) and the names Geoapify returns — so a selected name round-trips
// cleanly through autocomplete filtering and persistence.

const ISO_ALPHA2 = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB',
  'BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM',
  'CA','KY','CF','TD','CL','CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ',
  'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ','FI','FR','GF','PF','TF',
  'GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY','HT','HM','VA','HN',
  'HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR',
  'KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ',
  'MR','MU','YT','MX','FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI',
  'NE','NG','NU','NF','MK','MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR',
  'QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST','SA','SN','RS','SC','SL',
  'SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ',
  'TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
  'VE','VN','VG','VI','WF','EH','YE','ZM','ZW',
]

export interface Country {
  code: string
  name: string
}

const display = new Intl.DisplayNames(['en'], { type: 'region' })

/** All countries (code + English name), sorted by name. Built once at module load. */
export const COUNTRIES: Country[] = ISO_ALPHA2
  .map((code) => ({ code, name: display.of(code) ?? code }))
  .filter((c) => c.name !== c.code) // drop any code the runtime can't name
  .sort((a, b) => a.name.localeCompare(b.name))

const NAME_TO_CODE = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]))

/** Resolve a country name to its ISO alpha-2 code (for the autocomplete filter); undefined if unknown/blank. */
export function countryCode(name?: string): string | undefined {
  if (!name) return undefined
  return NAME_TO_CODE.get(name.trim().toLowerCase())
}
