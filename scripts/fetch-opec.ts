/**
 * Fetch OPEC+ member production data from the EIA International API.
 *
 * Pulls monthly total petroleum production (TBPD) for each of the
 * 13 OPEC+ members tracked below, going back 36 months. Compares
 * against the published "Declaration of Cooperation" production
 * targets (hardcoded reference table) and emits a compliance summary.
 *
 * Limitations disclosed in the dashboard:
 *   - EIA international data has ~3-month publication lag, so post-war
 *     production (Mar 2026 onwards) is NOT YET visible. The tracker
 *     shows pre-war baseline + quotas + structural context, not live
 *     production during the Hormuz crisis.
 *   - EIA reports "total petroleum and other liquids"; OPEC quotas
 *     are against crude oil only. Compliance comparison is therefore
 *     approximate.
 *   - Quota values are taken from the OPEC+ JMMC schedule as of late
 *     2024 and updated periodically as the cartel adjusts.
 *
 * Output: data/opec.json
 */

import fs from 'fs';
import path from 'path';

interface OpecMember {
  code: string;
  name: string;
  group: 'OPEC' | 'Non-OPEC';
  quotaKbpd: number | null;   // null = exempt or no formal quota
  exemptReason?: string;
}

const MEMBERS: OpecMember[] = [
  // OPEC
  { code: 'SAU', name: 'Saudi Arabia',   group: 'OPEC',     quotaKbpd: 8978 },
  { code: 'IRQ', name: 'Iraq',           group: 'OPEC',     quotaKbpd: 4000 },
  { code: 'IRN', name: 'Iran',           group: 'OPEC',     quotaKbpd: null, exemptReason: 'Exempt — sanctions' },
  { code: 'ARE', name: 'UAE',            group: 'OPEC',     quotaKbpd: 2912 },
  { code: 'KWT', name: 'Kuwait',         group: 'OPEC',     quotaKbpd: 2413 },
  { code: 'VEN', name: 'Venezuela',      group: 'OPEC',     quotaKbpd: null, exemptReason: 'Exempt — sanctions / production capacity' },
  { code: 'NGA', name: 'Nigeria',        group: 'OPEC',     quotaKbpd: 1500 },
  { code: 'LBY', name: 'Libya',          group: 'OPEC',     quotaKbpd: null, exemptReason: 'Exempt — political instability' },
  { code: 'DZA', name: 'Algeria',        group: 'OPEC',     quotaKbpd: 908 },
  { code: 'COG', name: 'Republic of Congo', group: 'OPEC',  quotaKbpd: 277 },
  { code: 'GNQ', name: 'Equatorial Guinea', group: 'OPEC',  quotaKbpd: 70 },
  // Non-OPEC (Declaration of Cooperation)
  { code: 'RUS', name: 'Russia',         group: 'Non-OPEC', quotaKbpd: 8978 },
  { code: 'KAZ', name: 'Kazakhstan',     group: 'Non-OPEC', quotaKbpd: 1468 },
  { code: 'OMN', name: 'Oman',           group: 'Non-OPEC', quotaKbpd: 762 },
  { code: 'AZE', name: 'Azerbaijan',     group: 'Non-OPEC', quotaKbpd: 551 },
  { code: 'BHR', name: 'Bahrain',        group: 'Non-OPEC', quotaKbpd: 196 },
  { code: 'BRN', name: 'Brunei',         group: 'Non-OPEC', quotaKbpd: 83 },
  { code: 'MYS', name: 'Malaysia',       group: 'Non-OPEC', quotaKbpd: 401 },
];

interface MonthlyPoint { period: string; kbpd: number; }
interface MemberData {
  code: string;
  name: string;
  group: 'OPEC' | 'Non-OPEC';
  quotaKbpd: number | null;
  exemptReason?: string;
  latestKbpd: number | null;
  latestPeriod: string | null;
  history: MonthlyPoint[];
  vsQuota: number | null;   // latest - quota (positive = over-producing)
}

async function fetchMember(member: OpecMember, apiKey: string, attempt = 1): Promise<MonthlyPoint[]> {
  const url = new URL('https://api.eia.gov/v2/international/data/');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('frequency', 'monthly');
  url.searchParams.set('data[0]', 'value');
  url.searchParams.set('facets[productId][]', '53');     // Total petroleum and other liquids
  url.searchParams.set('facets[activityId][]', '1');     // Production
  url.searchParams.set('facets[countryRegionId][]', member.code);
  url.searchParams.set('sort[0][column]', 'period');
  url.searchParams.set('sort[0][direction]', 'desc');
  url.searchParams.set('length', '36');

  const res = await fetch(url.toString());
  if (res.status === 429 && attempt < 3) {
    // Back off and retry
    await new Promise(r => setTimeout(r, 1500 * attempt));
    return fetchMember(member, apiKey, attempt + 1);
  }
  if (!res.ok) {
    console.warn(`  ${member.code} (${member.name}): HTTP ${res.status} after ${attempt} attempt(s)`);
    return [];
  }
  const json = await res.json() as { response?: { data?: { period: string; value: string }[] } };
  const rows = json.response?.data ?? [];
  return rows
    .map(r => ({ period: r.period, kbpd: parseFloat(r.value) }))
    .filter(p => isFinite(p.kbpd))
    .sort((a, b) => a.period.localeCompare(b.period));
}

async function main() {
  console.log('🛢️  Fetching OPEC+ production data from EIA International API');
  console.log('='.repeat(60));

  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim();
      if (k && !(k in process.env)) process.env[k] = v;
    }
  }

  const apiKey = process.env.EIA_API_KEY || 'DEMO_KEY';
  if (apiKey === 'DEMO_KEY') {
    console.warn('  ⚠️  EIA_API_KEY not set — falling back to DEMO_KEY (rate-limited)');
  }

  const members: MemberData[] = [];
  let opecTotal = 0;
  let nonOpecTotal = 0;
  let opecNonExemptTotal = 0;
  let nonOpecNonExemptTotal = 0;

  for (const m of MEMBERS) {
    process.stdout.write(`  ${m.code} (${m.name})... `);
    const history = await fetchMember(m, apiKey);
    const latest = history[history.length - 1];
    const member: MemberData = {
      code: m.code,
      name: m.name,
      group: m.group,
      quotaKbpd: m.quotaKbpd,
      exemptReason: m.exemptReason,
      latestKbpd:   latest?.kbpd ?? null,
      latestPeriod: latest?.period ?? null,
      history,
      vsQuota: latest?.kbpd != null && m.quotaKbpd != null ? Math.round(latest.kbpd - m.quotaKbpd) : null,
    };
    members.push(member);
    if (latest) {
      if (m.group === 'OPEC') {
        opecTotal += latest.kbpd;
        if (m.quotaKbpd != null) opecNonExemptTotal += latest.kbpd;
      } else {
        nonOpecTotal += latest.kbpd;
        if (m.quotaKbpd != null) nonOpecNonExemptTotal += latest.kbpd;
      }
    }
    console.log(latest ? `${latest.kbpd.toFixed(0)} kbpd (${latest.period})` : 'no data');
    await new Promise(r => setTimeout(r, 200)); // rate-limit politeness
  }

  // Latest period — assume mostly consistent across members
  const latestPeriod = members
    .map(m => m.latestPeriod)
    .filter((p): p is string => !!p)
    .sort()
    .slice(-1)[0] ?? null;

  // OPEC+ quota total (sum of non-exempt members)
  const opecQuotaTotal = MEMBERS
    .filter(m => m.group === 'OPEC' && m.quotaKbpd != null)
    .reduce((s, m) => s + (m.quotaKbpd ?? 0), 0);
  const nonOpecQuotaTotal = MEMBERS
    .filter(m => m.group === 'Non-OPEC' && m.quotaKbpd != null)
    .reduce((s, m) => s + (m.quotaKbpd ?? 0), 0);

  const out = {
    lastUpdated: new Date().toISOString(),
    latestDataPeriod: latestPeriod,
    dataSource: 'U.S. Energy Information Administration — International data, product 53 (Total petroleum and other liquids), activity 1 (Production)',
    quotaSource: 'OPEC+ Declaration of Cooperation (JMMC schedule as of late 2024 — updated periodically as cartel adjusts)',
    publicationLag: 'EIA international data is published with a ~3-month lag. Data through ' + (latestPeriod ?? 'unknown') + ' does not yet reflect the Hormuz war period.',
    totals: {
      opecKbpd:               Math.round(opecTotal),
      opecNonExemptKbpd:      Math.round(opecNonExemptTotal),
      nonOpecKbpd:            Math.round(nonOpecTotal),
      nonOpecNonExemptKbpd:   Math.round(nonOpecNonExemptTotal),
      combinedKbpd:           Math.round(opecTotal + nonOpecTotal),
      opecQuotaKbpd:          opecQuotaTotal,
      nonOpecQuotaKbpd:       nonOpecQuotaTotal,
      combinedQuotaKbpd:      opecQuotaTotal + nonOpecQuotaTotal,
      // Compliance: non-exempt actuals vs quota. Positive = over-producing.
      opecComplianceKbpd:     Math.round(opecNonExemptTotal - opecQuotaTotal),
      nonOpecComplianceKbpd:  Math.round(nonOpecNonExemptTotal - nonOpecQuotaTotal),
    },
    members,
  };

  const outPath = path.join(__dirname, '..', 'data', 'opec.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  console.log('\n✅ Wrote', outPath);
  console.log(`   OPEC total (latest):     ${out.totals.opecKbpd.toLocaleString()} kbpd · quota ${out.totals.opecQuotaKbpd.toLocaleString()}`);
  console.log(`   Non-OPEC total (latest): ${out.totals.nonOpecKbpd.toLocaleString()} kbpd · quota ${out.totals.nonOpecQuotaKbpd.toLocaleString()}`);
  console.log(`   Latest period:           ${out.latestDataPeriod}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
