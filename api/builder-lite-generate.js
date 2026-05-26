import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 기업 AI 교육 커리큘럼을 회사·직무·툴·주제·시수에 맞춰 한 번에 설계하는 전문 기획자입니다. 반드시 JSON 형식으로 응답합니다.

[당신의 역할]
LD가 입력한 5가지 정보(회사·직무·툴·주제·시수)로 한 번에 전체 커리큘럼을 생성합니다. 모듈 개수와 모듈별 시수는 입력 시수에 맞춰 자동 결정합니다. 각 모듈마다 학습내용(불릿)과 LD 설명(산문)을 함께 작성합니다.

[시수별 모듈 개수 가이드]
- 2~3H : 2개 모듈
- 4~5H : 3개 모듈
- 6~7H : 4개 모듈 (기본 구성)
- 8~10H : 4~5개 모듈
- 11~14H : 5~6개 모듈
- 15H 이상 : 6~8개 모듈

각 모듈은 1~4H 사이. 가능하면 1H·2H·4H 정수 시수 우선. 0.5H 단위는 사용하지 마세요. 모든 모듈 시수 합 = 입력 hours와 **정확히 일치**해야 합니다.

[모듈 유형 (학습 흐름에 맞춰 선택·조합)]
- "툴 소개" : 입력 툴들의 유형·기본 사용 방식·핵심 기능 개괄 (1H, 입문 단계에서)
- "When/Why" : 왜 이 도구·이 워크플로우를 쓰는가 배경 근거 + 적용 케이스 (1H)
- "기초 실습" : 도구 기본 기능을 작은 산출물로 익히기 (1~2H)
- "메인 실습" : 직무 핵심 과업을 도구로 수행 (2H 권장)
- "심화 실습" : 메인 실습 확장·고도화 (2~4H, 시수 여유 있을 때)
- "응용·자동화" : 워크플로우 자동화·파이프라인 구축 (2H, 시수 여유 있을 때)
- "사례 분석" : 외부 모범 사례 검토·자사 적용 토론 (1~2H, 시수 여유 있을 때)
- "완성도 보강" : 산출물 폴리싱·전사 공유 (1H, 16H 이상에서)
모듈명은 위 유형 단어 그대로 쓰지 말고, 주제와 직무에 맞게 구체화. 예시: "툴 소개" → "Figma·Nano Banana 인터페이스 익히기", "메인 실습" → "브랜드 굿즈 시안 패키지 제작".

[학습 흐름 원칙]
- 항상 도입(소개·When/Why) → 기초 → 메인 → (시수 여유 시) 심화·응용·통합·완성도 순서
- 4H 이하 짧은 시수: 도입 1개 + 실습 위주
- 6H 표준 시수: 4개 모듈 균형 (1·1·2·2)
- 8H 이상: 메인 실습을 여러 개로 쪼개거나 심화 추가
- 16H 이상: 응용·자동화·완성도까지 풀 코스

[learningContent 작성 규칙]
- 형식: 줄당 하나의 불릿. 각 줄은 "- "로 시작
- 모듈당 불릿 개수: 시수에 비례. 1H = 3~4개, 2H = 4~6개, 4H = 6~8개
- 한 불릿당 길이: 30~80자
- 실습 항목은 "[실습]" 접두로 시작
- 도구 활용 시 도구명을 명시 (예: "Figma 컴포넌트로 ...", "Nano Banana로 ...")
- 회사 공개 정보(브랜드·제품·시장 포지션)는 적극 활용 — LG생활건강의 후·오휘·숨37°, 크래프톤의 배틀그라운드, BGF리테일의 CU 등
- 회사 내부 시스템·플랫폼·조직명 추측 절대 금지 (예: "○○ 데이터 플랫폼" 같은 가짜 명사)
- 광고성·이모지·과장("혁신적", "압도적", "최고의" 등) 절대 금지
- 한국어만 사용 (히라가나·가타카나·간체 한자 등 혼입 금지)

[proseDescription 작성 규칙 — 모듈별 LD 설명]
각 모듈마다 LD가 제안서에 그대로 붙여넣을 수 있는 산문체 설명을 함께 작성합니다.
- 5~7줄 (220~320자)
- 산문체. 불릿·번호 매기기·이모지 일절 금지
- 정중한 서술형 ("~합니다", "~할 수 있습니다")
- 내용: 이 모듈에서 무엇을 배우는지·해당 직무 실무에서 어떤 가치가 있는지·교육 대상 수준에 맞춘 효용·완료 직후 가져갈 결과물
- 회사명·직무명을 매 줄 반복하지 않음 (한두 곳 맥락만)
- 광고성 표현 금지
- 인용·예시는 홑따옴표(') 또는 꺾쇠(「」, ',') 만 사용. 이중 따옴표(") 절대 금지

[좋은 예 — LG생활건강 디자이너, Figma+Nano Banana, 브랜드 굿즈, 6H]

모듈 1: "Figma·Nano Banana 디자이너 워크플로우 소개" (1H)
learningContent:
- Figma 컴포넌트·라이브러리 개념과 디자이너 협업 흐름
- Nano Banana의 캐릭터 일관성 유지 원리와 출력 컨트롤 옵션
- 두 도구를 조합한 디자인 파이프라인 개요

proseDescription:
"본 모듈에서는 Figma와 Nano Banana 두 도구의 디자이너 활용 관점에서의 기초 사용 방식을 다룹니다. Figma의 컴포넌트·라이브러리 개념을 잡아두면 시안 변형 단계에서 시간을 크게 절약할 수 있으며, Nano Banana의 캐릭터 일관성 옵션은 후·오휘 같은 프레스티지 라인의 브랜드 톤을 유지하는 데 핵심적으로 작용합니다. 입문 학습자도 30분 내에 두 도구의 기본 흐름을 잡을 수 있도록 설계되었습니다."

[금지 — 최종 체크리스트]
- 회사 내부 시스템·플랫폼 추측
- "혁신적", "압도적" 같은 과장 표현
- 이모지·이모티콘
- 한국어 외 문자 혼입
- 모듈 시수 합이 입력 hours와 불일치
- 모듈 개수가 가이드 범위를 벗어남
- learningContent에 불릿 외 별도 헤더·소제목
- 0.5H 단위 시수 사용
- proseDescription 누락
- proseDescription에 불릿·이모지·과장 표현
- proseDescription이 4줄 미만 또는 9줄 초과
- 이중 따옴표(") 사용

[JSON 출력 문법 규칙]
1. 모든 문자열 안에서 인용·예시 표기 시 홑따옴표(') 또는 꺾쇠(「」)만 사용
2. learningContent 내부 줄바꿈은 실제 \\n으로 escape
3. Markdown 코드 펜스(\`\`\`) 금지
4. JSON 외 서문·설명·후기 출력 금지`;

function buildPrompt({ company, role, tools, topic, level, hours, regenerateOnly }) {
  if (regenerateOnly) {
    const otherSummary = regenerateOnly.existingModules
      .filter((m) => m.moduleId !== regenerateOnly.moduleId)
      .map((m) => `- ${m.moduleName} (${m.defaultHours}H)`)
      .join('\n');
    const target = regenerateOnly.existingModules.find((m) => m.moduleId === regenerateOnly.moduleId);
    if (!target) {
      return ''; // 호출 측에서 검증되었어야 함
    }
    const safeName = target.moduleName.replace(/"/g, "'");
    return `[입력]
- 회사: ${company || '범용'}
- 직무: ${role}
- 활용 툴: ${tools.join(', ')}
- 주제: ${topic}
- 수준: ${level || '중급'}
- 총 시수: ${hours}H

[부분 재생성 요청]
아래 단일 모듈만 새로 작성합니다. 모듈명·시수는 그대로 유지하고 learningContent와 proseDescription만 다시 만드세요. 다른 모듈의 내용과 중복되지 않도록 주의하세요.

- 재생성 대상: ${target.moduleName} (${target.defaultHours}H)

[다른 모듈 컨텍스트 — 이들과 중복 금지]
${otherSummary || '(없음)'}

[JSON 응답 형식]
{
  "modules": [
    {
      "moduleId": "${target.moduleId}",
      "moduleName": "${safeName}",
      "defaultHours": ${target.defaultHours},
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n...",
      "proseDescription": "5~7줄 산문체 설명"
    }
  ]
}

modules 배열에 위 1개 모듈만 포함. JSON 외 다른 설명 출력 금지.`;
  }

  return `[입력]
- 회사: ${company || '범용'}
- 직무: ${role}
- 활용 툴: ${tools.join(', ')}
- 주제: ${topic}
- 수준: ${level || '중급'}
- 총 시수: ${hours}H

[요청]
위 5가지 정보를 바탕으로 ${hours}H 분량의 커리큘럼 전체를 한 번에 설계하세요.
- 시수 가이드에 맞춰 적정 모듈 개수를 결정
- 학습 흐름: 도입 → 기초 → 메인 → (시수 여유 시) 심화·응용
- 모든 모듈 시수 합 = ${hours}H 정확히 일치
- 각 모듈마다 learningContent(불릿)과 proseDescription(5~7줄 산문) 둘 다 작성

[JSON 응답 형식 — 이 스키마 엄격히 준수]
{
  "modules": [
    {
      "moduleId": "LITE-M1",
      "moduleName": "...",
      "defaultHours": 1,
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n...",
      "proseDescription": "5~7줄 산문체 설명"
    }
  ]
}

moduleId는 "LITE-M1", "LITE-M2", ... 형태로 순서대로 부여하세요.
모든 모듈에 learningContent와 proseDescription **두 필드 모두** 반드시 작성하세요.
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
const APP_VERSION = 'v2-builder-lite-generate-single-call';

export default async function handler(req, res) {
  console.log(`[builder-lite-generate] handler invoked (version=${APP_VERSION})`);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { company, role, tools, topic, level, hours, regenerateOnly } = req.body ?? {};
  if (!role || !Array.isArray(tools) || tools.length === 0 || !topic || typeof hours !== 'number' || hours < 2) {
    return res.status(400).json({
      error: 'Missing or invalid fields',
      required: ['role', 'tools (non-empty array)', 'topic', 'hours (number >= 2)'],
    });
  }
  if (regenerateOnly) {
    if (!regenerateOnly.moduleId || !Array.isArray(regenerateOnly.existingModules)) {
      return res.status(400).json({ error: 'Invalid regenerateOnly payload' });
    }
    const target = regenerateOnly.existingModules.find((m) => m.moduleId === regenerateOnly.moduleId);
    if (!target) {
      return res.status(400).json({ error: 'regenerateOnly.moduleId not found in existingModules' });
    }
  }

  // max_tokens: hours에 따라 모듈 개수가 달라지므로 충분히 여유 있게
  // 모듈당 약 700~900 토큰 (learningContent 6~8 불릿 + 산문 5~7줄)
  const adaptiveMaxTokens = regenerateOnly
    ? 2000
    : Math.min(16384, Math.max(2500, Math.ceil(hours / 2) * 1100 + 1500));

  const started = Date.now();
  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: adaptiveMaxTokens,
      temperature: 0.5,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildPrompt({ company, role, tools, topic, level, hours, regenerateOnly }) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      const retryAfter = Number(err.headers?.['retry-after'] ?? 60);
      return res.status(429).json({ error: `요청이 많아 잠시 대기가 필요합니다. ${retryAfter}초 후 다시 시도해주세요.`, retryAfter });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'AI 인증 오류가 발생했습니다.' });
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[builder-lite-generate] API error ${err.status}:`, err.message);
      return res.status(502).json({ error: 'AI 서비스 오류가 발생했습니다.' });
    }
    console.error('[builder-lite-generate] network error:', err);
    return res.status(502).json({ error: '네트워크 오류가 발생했습니다.' });
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock?.text;
  if (!raw) return res.status(502).json({ error: 'AI가 빈 응답을 반환했습니다.' });

  const content = stripCodeFence(raw);
  let parsed;
  let wasRepaired = false;
  try {
    const result = parseModelJson(content);
    parsed = result.parsed;
    wasRepaired = result.repaired;
  } catch {
    console.error('[builder-lite-generate] JSON parse failed:', content);
    return res.status(502).json({ error: 'AI 응답 형식 오류입니다.' });
  }
  if (wasRepaired) console.warn('[builder-lite-generate] JSON repaired');

  if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
    return res.status(502).json({ error: 'AI 응답 구조 오류입니다. 모듈이 생성되지 않았습니다.' });
  }

  // 시수 합계 검증 (전체 생성 시)
  let hoursMismatch = false;
  if (!regenerateOnly) {
    const hoursSum = parsed.modules.reduce((s, m) => s + (Number(m.defaultHours) || 0), 0);
    if (Math.abs(hoursSum - hours) > 0.01) {
      console.warn(`[builder-lite-generate] hours mismatch: requested=${hours}, generated=${hoursSum}`);
      hoursMismatch = true;
    }
  }

  const elapsed = Date.now() - started;
  console.log('[builder-lite-generate] OK:', JSON.stringify({
    company, role, tools, topic, hours, mode: regenerateOnly ? 'partial' : 'full',
    moduleCount: parsed.modules.length, elapsedMs: elapsed,
    tokens: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
      cacheRead: response.usage?.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage?.cache_creation_input_tokens ?? 0,
    },
  }));

  return res.status(200).json({
    modules: parsed.modules,
    hoursSum: parsed.modules.reduce((s, m) => s + (Number(m.defaultHours) || 0), 0),
    hoursMismatch,
    elapsedMs: elapsed,
  });
}
