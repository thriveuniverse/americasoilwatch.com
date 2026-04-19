// AmericasOilWatch — Country configuration
// Production figures: approximate 2025 averages (thousand bpd)

export interface ProducerConfig {
  code: string;
  name: string;
  flag: string;
  productionKbpd: number;
  productionTrend: 'rising' | 'stable' | 'falling';
  keyGrades: string[];
  note: string;
  region: 'north' | 'central' | 'south' | 'caribbean';
}

export const PRODUCERS: ProducerConfig[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    productionKbpd: 13300,
    productionTrend: 'stable',
    keyGrades: ['WTI', 'Eagle Ford', 'Permian Light'],
    note: "World's largest producer. Shale-dominant. WTI benchmark set at Cushing, Oklahoma.",
    region: 'north',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    productionKbpd: 5500,
    productionTrend: 'stable',
    keyGrades: ['Western Canadian Select (WCS)', 'Syncrude', 'Cold Lake Blend'],
    note: 'Second-largest producer. Oil sands dominant. WCS trades at discount to WTI due to heavy, sour grade and pipeline constraints.',
    region: 'north',
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    productionKbpd: 3500,
    productionTrend: 'rising',
    keyGrades: ['Tupi', 'Buzios', 'Lula'],
    note: "South America's largest producer. Petrobras-led pre-salt deepwater fields driving sustained growth.",
    region: 'south',
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    productionKbpd: 1800,
    productionTrend: 'falling',
    keyGrades: ['Maya (heavy sour)', 'Isthmus', 'Olmeca'],
    note: "PEMEX state monopoly. Production has fallen sharply since 2004 peak. Aging Cantarell field. New Dos Bocas refinery online.",
    region: 'central',
  },
  {
    code: 'GY',
    name: 'Guyana',
    flag: '🇬🇾',
    productionKbpd: 650,
    productionTrend: 'rising',
    keyGrades: ['Liza Light', 'Payara'],
    note: "Fastest-growing oil producer in the world. ExxonMobil-led Stabroek block. Targeting 1.2m bpd by 2027. No refining capacity — all exported crude.",
    region: 'south',
  },
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    productionKbpd: 750,
    productionTrend: 'falling',
    keyGrades: ['Vasconia', 'Castilla'],
    note: 'Declining output from mature fields. Government restricting new exploration contracts. Ecopetrol state company.',
    region: 'south',
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    productionKbpd: 900,
    productionTrend: 'rising',
    keyGrades: ['Merey (extra heavy)', 'BCF-17'],
    note: "OPEC member. World's largest proven reserves (302 billion bbl) but production collapsed from 3m+ bpd under sanctions and mismanagement. Partial recovery underway.",
    region: 'south',
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    productionKbpd: 700,
    productionTrend: 'rising',
    keyGrades: ['Medanito', 'Escalante'],
    note: 'Vaca Muerta shale formation is world-class — second only to Permian in recoverable shale oil. Rapid development underway under pro-investment government.',
    region: 'south',
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    productionKbpd: 480,
    productionTrend: 'falling',
    keyGrades: ['Oriente', 'Napo'],
    note: "OPEC member. Amazon basin production. Security challenges and declining legacy field output.",
    region: 'south',
  },
  {
    code: 'TT',
    name: 'Trinidad & Tobago',
    flag: '🇹🇹',
    productionKbpd: 70,
    productionTrend: 'falling',
    keyGrades: ['Trintopec crude'],
    note: 'Mature producer. Atlantic LNG hub — significant natural gas exporter to US and Europe. Refining capacity exceeds local production.',
    region: 'caribbean',
  },
  {
    code: 'PE',
    name: 'Peru',
    flag: '🇵🇪',
    productionKbpd: 120,
    productionTrend: 'stable',
    keyGrades: ['Loreto crude'],
    note: 'Amazon basin production. Norperuano pipeline. Petroperu state refinery at Talara recently upgraded.',
    region: 'south',
  },
  {
    code: 'BO',
    name: 'Bolivia',
    flag: '🇧🇴',
    productionKbpd: 55,
    productionTrend: 'falling',
    keyGrades: ['Bolivian condensate'],
    note: 'Primarily natural gas — South America\'s key gas supplier to Brazil and Argentina. Oil production minor and declining.',
    region: 'south',
  },
];

export const COUNTRY_MAP = Object.fromEntries(PRODUCERS.map(p => [p.code, p]));
