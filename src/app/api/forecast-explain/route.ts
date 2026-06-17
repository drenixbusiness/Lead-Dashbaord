import { NextRequest, NextResponse } from 'next/server';

export interface ExplainRequest {
  history: {
    month: string;
    leads: number;
    hired_by_leads: number;
    hired_by_leadbase: number;
    hired_by_referral: number;
    hired: number;
    ad_spend_usd: number;
    hire_rate_pct: number;
  }[];
  forecast: {
    month: string;
    leads: number;
    hiredLeads: number;
    hiredLB: number;
    hiredRef: number;
    totalHired: number;
    leadsRate: string;
    lbRate: string;
    overallRate: string;
    adSpend: string;
    cphLeads: string;
    cphLB: string;
  };
}

export interface ExplainResponse {
  leads: string;
  hiredLeads: string;
  hiredLB: string;
  hiredRef: string;
  totalHired: string;
  leadsRate: string;
  lbRate: string;
  overallRate: string;
  adSpend: string;
  cphLeads: string;
  cphLB: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set in environment' }, { status: 500 });
  }

  const body: ExplainRequest = await req.json();
  const { history, forecast } = body;

  const historyLines = history.map(r =>
    `${r.month}: ${r.leads} leads, ${r.hired_by_leads} hired(leads), ${r.hired_by_leadbase} hired(LB), ${r.hired_by_referral} hired(ref), $${Math.round(r.ad_spend_usd)} spend, ${r.hire_rate_pct.toFixed(1)}% overall hire rate`
  ).join('\n');

  const prompt = `You are a recruiting operations analyst. You have historical lead performance data and a forecast.
For each forecast metric, write exactly 1 sentence (12-18 words) explaining: what the number is based on and the key trend driving it.
Be specific with numbers. Do not use filler phrases like "This metric" or "Based on the data".

Historical data (last ${history.length} months):
${historyLines}

Forecast for ${forecast.month}:
- Total leads: ${forecast.leads}
- Hired from Leads: ${forecast.hiredLeads}
- Hired from Lead Base: ${forecast.hiredLB}
- Hired from Referral: ${forecast.hiredRef} (assumed flat — referrals not trended)
- Total hired: ${forecast.totalHired}
- Hire rate (leads only): ${forecast.leadsRate}
- Hire rate (Lead Base only): ${forecast.lbRate}
- Overall hire rate: ${forecast.overallRate}
- Ad spend: ${forecast.adSpend}
- CPH (leads only): ${forecast.cphLeads}
- CPH (Lead Base only): ${forecast.cphLB}

Reply ONLY with valid JSON, no markdown, no extra keys:
{
  "leads": "...",
  "hiredLeads": "...",
  "hiredLB": "...",
  "hiredRef": "...",
  "totalHired": "...",
  "leadsRate": "...",
  "lbRate": "...",
  "overallRate": "...",
  "adSpend": "...",
  "cphLeads": "...",
  "cphLB": "..."
}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 502 });
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '{}';
    return NextResponse.json(JSON.parse(content) as ExplainResponse);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
