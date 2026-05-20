/**
 * Données institutionnelles officielles — Convention Baptiste du Togo (CBT).
 */
export const CBT_INSTITUTION = {
  name: "Convention Baptiste du Togo",
  acronym: "CBT",
  movement: "Christianisme baptiste",
  theology: "Théologie évangélique",
  headquarters: "Lomé, Togo",
  affiliations: [
    "Conseil chrétien du Togo",
    "Alliance baptiste mondiale",
  ] as const,
  founded: 1964,
  members: 25_403,
  churches: 537,
  theologySchool:
    "École supérieure baptiste de théologie de l'Afrique de l'Ouest",
  website: "https://conventionbaptistetogo.org",
  websiteLabel: "conventionbaptistetogo.org",
  contact: {
    phone: "90 86 03 00",
    phoneTel: "+22890860300",
    email: "convention.togo@gmail.com",
    address: "Boulevard de la Kara, Tokoin Doumasséssé",
    city: "Lomé, Togo",
    poBox: "08 B.P. 80754",
    facebookLabel: "Convention Baptiste du Togo - CBT",
  },
} as const;

export function formatFrenchNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}
