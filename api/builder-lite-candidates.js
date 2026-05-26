import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 기업 AI 교육의 메인 실습(M4) 시나리오를 설계하는 전문 기획자입니다. 반드시 JSON 형식으로 응답합니다.

[당신의 역할]
회사·직무·툴·주제 4가지 입력을 받아, 해당 직무가 실무에서 자주 부딪히는 과업 중 입력 툴들을 활용했을 때 가장 가치 있는 메인 실습 시나리오 후보 3개를 제시합니다.

[후보 카드 1개 구성 — 4 필드]
1. title : 한 줄 시나리오 제목 (15~30자, 동사로 끝남 — "~제작", "~구축", "~설계" 같은 명사형 종결 권장)
2. goal  : 학습 목표 1~2줄 (이 시나리오를 마치면 학습자가 무엇을 할 수 있게 되는지)
3. features: 사용 feature 배열 (3~5개. 각 항목은 "툴명 + 기능명" 형태. 예: "Figma 컴포넌트 변형", "Nano Banana 캐릭터 일관성")
4. deliverable: 예상 산출물 1줄 (구체적 수량·형태 포함. 예: "굿즈 4종 × 시안 3안 = 12장")

[3개 후보의 다양성 원칙]
- 후보 1 (top): 가장 보편적이고 성공률 높은 시나리오 (해당 직무의 정통 과업)
- 후보 2 (variant): 도구 활용 폭을 더 넓힌 시나리오 (여러 툴 결합 강도 높임)
- 후보 3 (stretch): 약간 도전적이지만 학습 효과 큰 시나리오 (자동화·파이프라인·고난도)
세 후보는 서로 명확히 구분되어야 합니다 — 같은 일을 표현만 바꾼 카드는 거부합니다.

[톤앤매너]
- 회사의 공개 브랜드·제품·시장 포지션을 적극 활용 (LG생활건강의 후·오휘·숨37°, 크래프톤의 배틀그라운드, BGF리테일의 CU 등)
- 회사 내부 시스템·플랫폼·조직명은 추측 금지 ("○○ 데이터 플랫폼" 같은 가짜 명사 금지)
- 광고성 표현·이모지·"혁신적", "압도적" 같은 과장 금지
- 한국어만 사용 (히라가나·가타카나·간체 한자 등 혼입 금지)
- 시수·수준·보안은 미반영 (이 단계는 표준 시나리오 도출. 운영 제약은 후속 단계)

[툴 활용 균형]
입력 툴이 여러 개면 각 카드에서 가능한 모든 입력 툴을 활용한 시나리오로 작성. 단일 툴만 활용한 카드는 피하세요. 단, 의미 없는 조합("Figma에서 보고서 작성") 금지.

[JSON 출력 문법 규칙]
1. 모든 문자열 안에서 인용·예시 표기 시 홑따옴표(') 또는 꺾쇠(「」, ',') 만 사용. 이중 따옴표(") 절대 금지
2. Markdown 코드 펜스(\`\`\`) 금지
3. JSON 외 서문·설명·후기 출력 금지

[금지 — 최종 체크리스트]
- 회사 내부 시스템·플랫폼 추측 (예: "○○ 데이터 플랫폼")
- "혁신적", "압도적", "최고의" 등 과장 표현
- 이모지·이모티콘
- 한국어 외 문자 혼입
- 시나리오가 너무 추상적 ("AI 활용 마케팅 자동화" 같은 막연한 제목)
- 3개 후보가 서로 너무 비슷 (다양성 부족)
- title이 30자 초과 또는 10자 미만`;

function buildPrompt({ company, role, tools, topic }) {
  return `[입력]
- 회사: ${company || '범용'}
- 직무: ${role}
- 활용 툴: ${tools.join(', ')}
- 주제: ${topic}

[요청]
위 4가지 입력을 바탕으로 M4 메인 실습 후보 3개를 생성하세요. 세 후보는 다양성 원칙(top·variant·stretch)에 따라 서로 명확히 구분되어야 합니다.

[JSON 응답 형식 — 이 스키마 엄격히 준수]
{
  "candidates": [
    {
      "id": "c1",
      "tier": "top",
      "title": "...",
      "goal": "...",
      "features": ["...", "...", "..."],
      "deliverable": "..."
    },
    {
      "id": "c2",
      "tier": "variant",
      "title": "...",
      "goal": "...",
      "features": ["...", "...", "..."],
      "deliverable": "..."
    },
    {
      "id": "c3",
      "tier": "stretch",
      "title": "...",
      "goal": "...",
      "features": ["...", "...", "..."],
      "deliverable": "..."
    }
  ]
}

JSON 외 다른 설명·서문·후기를 절대 출력하지 마세요. Markdown 코드 펜스(\`\`\`)로 감싸지 마세요.`;
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
}

function repairJsonStrings(text) {
  const out = [];
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { out.push(ch); escape = false; continue; }
    if (ch === '\\') { out.push(ch); escape = true; continue; }
    if (ch !== '"') { out.push(ch); continue; }
    if (!inString) { inString = true; out.push(ch); continue; }
    let j = i + 1;
    while (j < text.length && /\s/.test(text[j])) j++;
    const next = text[j];
    if (next === ':' || next === ',' || next === '}' || next === ']' || next === undefined) {
      inString = false;
      out.push(ch);
    } else {
      out.push('\\"');
    }
  }
  return out.join('');
}

function parseModelJson(text) {
  try {
    return { parsed: JSON.parse(text), repaired: false };
  } catch {
    const repaired = repairJsonStrings(text);
    return { parsed: JSON.parse(repaired), repaired: true };
  }
}

const client = new Anthropic();
const APP_VERSION = 'v1-builder-lite-candidates';

export default async function handler(req, res) {
  console.log(`[builder-lite-candidates] handler invoked (version=${APP_VERSION})`);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[builder-lite-candidates] ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { company, role, tools, topic } = req.body ?? {};
  if (!role || !Array.isArray(tools) || tools.length === 0 || !topic) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['role', 'tools (non-empty array)', 'topic'],
    });
  }

  const started = Date.now();
  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      temperature: 0.6,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildPrompt({ company, role, tools, topic }) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      const retryAfter = Number(err.headers?.['retry-after'] ?? 60);
      return res.status(429).json({ error: `요청이 많아 잠시 대기가 필요합니다. ${retryAfter}초 후 다시 시도해주세요.`, retryAfter });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('[builder-lite-candidates] auth error:', err.message);
      return res.status(500).json({ error: 'AI 인증 오류가 발생했습니다.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[builder-lite-candidates] API error ${err.status}:`, err.message);
      return res.status(502).json({ error: 'AI 서비스 오류가 발생했습니다.' });
    }
    console.error('[builder-lite-candidates] network error:', err);
    return res.status(502).json({ error: '네트워크 오류가 발생했습니다.' });
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock?.text;
  if (!raw) {
    return res.status(502).json({ error: 'AI가 빈 응답을 반환했습니다.' });
  }

  const content = stripCodeFence(raw);
  let parsed;
  let wasRepaired = false;
  try {
    const result = parseModelJson(content);
    parsed = result.parsed;
    wasRepaired = result.repaired;
  } catch {
    console.error('[builder-lite-candidates] JSON parse failed:', content);
    return res.status(502).json({ error: 'AI 응답 형식 오류입니다. 다시 시도해주세요.' });
  }
  if (wasRepaired) console.warn('[builder-lite-candidates] JSON repaired');

  if (!Array.isArray(parsed.candidates) || parsed.candidates.length !== 3) {
    console.error('[builder-lite-candidates] invalid candidates shape:', parsed);
    return res.status(502).json({ error: 'AI 응답 구조 오류입니다. 다시 시도해주세요.' });
  }

  const elapsed = Date.now() - started;
  console.log('[builder-lite-candidates] OK:', JSON.stringify({
    company, role, tools, topic, elapsedMs: elapsed,
    tokens: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
      cacheRead: response.usage?.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage?.cache_creation_input_tokens ?? 0,
    },
  }));

  return res.status(200).json({ candidates: parsed.candidates, elapsedMs: elapsed });
}
