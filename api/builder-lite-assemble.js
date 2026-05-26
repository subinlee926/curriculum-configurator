import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 기업 AI 교육 커리큘럼의 4개 모듈(M1~M4)을 메인 실습(M4)부터 역산하여 설계하는 전문 기획자입니다. 반드시 JSON 형식으로 응답합니다.

[당신의 역할]
회사·직무·툴·주제와 LD가 선택한 M4 메인 실습 시나리오를 받아, 그 시나리오로 가는 학습 흐름을 M1(툴 소개) → M2(When/Why) → M3(기초 실습) → M4(메인 실습) 4개 모듈로 설계합니다.

[설계 원칙 — M4 역산]
내부적으로는 M4 → M3 → M2 → M1 역순으로 생각하고, 출력만 M1→M4 순서로 합니다.

- M4 (메인 실습): LD가 선택한 시나리오 그대로. learningContent는 시나리오를 단계별 실습으로 분해한 4~6개 불릿
- M3 (기초 실습): M4에서 사용한 feature들을 익히는 기초 실습. learningContent는 M4 feature 역산 기반 3~5개 불릿. 작은 산출물 1~2개 만들기
- M2 (When/Why): 왜 이 도구·이 워크플로우를 쓰는가에 대한 강의·토론. learningContent는 배경 근거 + 적용 케이스 3~5개 불릿
- M1 (툴 소개): 입력 툴들의 유형·기본 사용 방식·핵심 기능 개괄. learningContent는 입력된 모든 툴을 균등하게 다루는 3~5개 불릿

[모듈 메타]
M1: moduleId="LITE-M1", moduleName="툴 소개", defaultHours=1
M2: moduleId="LITE-M2", moduleName="When/Why — 활용 맥락", defaultHours=1
M3: moduleId="LITE-M3", moduleName="기초 실습", defaultHours=2
M4: moduleId="LITE-M4", moduleName=선택된 M4 시나리오의 title 값, defaultHours=2
모든 모듈의 difficulty는 입력 received_level 그대로 ("중급" 기본).

[learningContent 작성 규칙]
- 형식: 줄당 하나의 불릿. 각 줄은 "- "로 시작
- 불필요한 헤더·소제목 금지 — 불릿 라인만
- 한 불릿당 길이: 30~80자 (너무 짧지도, 너무 길지도 않게)
- 회사 공개 정보(브랜드·제품)는 적극 활용. 내부 시스템·플랫폼 추측 금지
- 광고성·이모지·과장 표현 금지
- 한국어만 사용
- 실습 항목은 "[실습]" 접두로 시작 (M3·M4의 일부 불릿에 해당)
- 도구 활용 시 도구명을 명시 (예: "Figma 컴포넌트로 ...", "Nano Banana 캐릭터 일관성 활용...")

[좋은 learningContent 예시 — M4 (LG생활건강 디자이너, Figma+Nano Banana, 굿즈 디자인 시나리오)]
- 브랜드 무드보드 정의 — 후·오휘 프레스티지 라인의 컬러·재질·심볼 정리
- Nano Banana로 캐릭터 일관성 유지하며 굿즈 시안 4종 초안 생성
- [실습] Figma 컴포넌트로 굿즈 패키지 템플릿 제작 (4종 × 3안 = 12장)
- 시안 변형·교차 검토를 통한 최종 안 도출
- 산출물 정리 — 디자인 가이드 + 시안 패키지 export

[금지 — 최종 체크리스트]
- 회사 내부 시스템·플랫폼 추측 ("○○ 데이터 플랫폼" 등)
- "혁신적", "압도적" 같은 과장 표현
- 이모지·이모티콘
- 한국어 외 문자 (히라가나·가타카나·간체 한자 등) 혼입
- 불릿 외 별도 헤더·소제목
- learningContent에 줄바꿈 외 다른 구조 (표·번호 매김 등)
- moduleId·moduleName·defaultHours 임의 변경 (위 메타 그대로 사용)
- M4 moduleName이 선택된 시나리오 title과 다름

[JSON 출력 문법 규칙]
1. 모든 문자열 안에서 인용·예시 표기 시 홑따옴표(') 또는 꺾쇠(「」, ',') 만 사용. 이중 따옴표(") 절대 금지
2. learningContent 내부 줄바꿈은 실제 \\n으로 escape
3. Markdown 코드 펜스(\`\`\`) 금지
4. JSON 외 서문·설명·후기 출력 금지`;

function buildPrompt({ company, role, tools, topic, level, selectedM4 }) {
  return `[입력]
- 회사: ${company || '범용'}
- 직무: ${role}
- 활용 툴: ${tools.join(', ')}
- 주제: ${topic}
- 수준: ${level || '중급'}

[LD가 선택한 M4 메인 실습 시나리오]
- 제목: ${selectedM4.title}
- 학습 목표: ${selectedM4.goal}
- 사용 feature: ${Array.isArray(selectedM4.features) ? selectedM4.features.join(', ') : ''}
- 예상 산출물: ${selectedM4.deliverable}

[요청]
위 정보를 바탕으로 M1~M4 4개 모듈을 설계하세요. M4부터 역산하여 M3·M2·M1을 채우되, 출력은 M1→M4 순서로 합니다.
M4의 moduleName은 반드시 위 시나리오 제목 그대로 사용하세요.

[JSON 응답 형식 — 이 스키마 엄격히 준수]
{
  "topicName": "${topic}",
  "modules": [
    {
      "level": "M1",
      "moduleId": "LITE-M1",
      "moduleName": "툴 소개",
      "defaultHours": 1,
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n- 불릿3\\n..."
    },
    {
      "level": "M2",
      "moduleId": "LITE-M2",
      "moduleName": "When/Why — 활용 맥락",
      "defaultHours": 1,
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n..."
    },
    {
      "level": "M3",
      "moduleId": "LITE-M3",
      "moduleName": "기초 실습",
      "defaultHours": 2,
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n..."
    },
    {
      "level": "M4",
      "moduleId": "LITE-M4",
      "moduleName": "${selectedM4.title.replace(/"/g, "'")}",
      "defaultHours": 2,
      "difficulty": "${level || '중급'}",
      "learningContent": "- 불릿1\\n- 불릿2\\n..."
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
const APP_VERSION = 'v1-builder-lite-assemble';

export default async function handler(req, res) {
  console.log(`[builder-lite-assemble] handler invoked (version=${APP_VERSION})`);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { company, role, tools, topic, level, selectedM4 } = req.body ?? {};
  if (!role || !Array.isArray(tools) || tools.length === 0 || !topic || !selectedM4?.title) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['role', 'tools (non-empty array)', 'topic', 'selectedM4.title'],
    });
  }

  const started = Date.now();
  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 4500,
      temperature: 0.5,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildPrompt({ company, role, tools, topic, level, selectedM4 }) }],
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
      console.error(`[builder-lite-assemble] API error ${err.status}:`, err.message);
      return res.status(502).json({ error: 'AI 서비스 오류가 발생했습니다.' });
    }
    console.error('[builder-lite-assemble] network error:', err);
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
    console.error('[builder-lite-assemble] JSON parse failed:', content);
    return res.status(502).json({ error: 'AI 응답 형식 오류입니다.' });
  }
  if (wasRepaired) console.warn('[builder-lite-assemble] JSON repaired');

  if (!Array.isArray(parsed.modules) || parsed.modules.length !== 4) {
    return res.status(502).json({ error: 'AI 응답 구조 오류입니다. 모듈 4개가 모두 생성되지 않았습니다.' });
  }

  const elapsed = Date.now() - started;
  console.log('[builder-lite-assemble] OK:', JSON.stringify({
    company, role, tools, topic, m4Title: selectedM4.title, elapsedMs: elapsed,
    tokens: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
      cacheRead: response.usage?.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage?.cache_creation_input_tokens ?? 0,
    },
  }));

  return res.status(200).json({
    topicName: parsed.topicName || topic,
    modules: parsed.modules,
    elapsedMs: elapsed,
  });
}
