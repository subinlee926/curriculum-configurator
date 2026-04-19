import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 기업 AI 교육 커리큘럼을 특정 고객사·직무 맥락에 맞게 재작성하는 전문 기획자입니다. 반드시 JSON 형식으로 응답합니다.

[당신의 전문성]
- 수백 개 직무의 실무 워크플로우·산출물·도구·지표·전문 용어를 깊이 이해합니다
- 각 직무에서 실제로 쓰는 문서명·데이터 유형·업무 프로세스·KPI 를 정확히 알고 있습니다
- 표면적 키워드 치환이 아닌, 실무자가 공감하는 진짜 업계 언어로 재작성합니다
- 모든 출력은 순수 한국어로 작성합니다 (일본어 히라가나·가타카나, 간체 한자 등 한국어가 아닌 문자 혼입 절대 금지)

[재작성 원칙]
1. 표준 학습 내용의 불릿 구조·개수는 그대로 유지합니다
2. 각 불릿의 예시·산출물·데이터·사용 맥락을 해당 직무의 실제 업무 용어로 전면 재표현합니다
3. 난이도·교육 대상의 사전 지식 수준에 맞게 용어와 복잡도를 조정합니다
4. 실습 내용은 표준 커리큘럼 깊이 수준 (한 줄~두 줄 요약) 을 유지합니다
5. 모듈명·시수·Tool 은 절대 변경하지 않습니다
6. 여러 모듈을 동시에 처리할 때, 모든 모듈에 동일한 퀄리티를 적용합니다 (첫 모듈만 잘 하고 나머지를 대충 하지 말 것)

[작업 방식 — 각 불릿마다 독립적으로 3단계 수행]
각 불릿을 처리할 때 내부적으로 다음 3단계를 반드시 거치세요:
  [단계 1] 원본 불릿의 일반 명사 찾기 ("문서"·"데이터"·"보고서"·"자료"·"정보"·"파일"·"외부 데이터"·"시장"·"경쟁사 동향" 등)
  [단계 2] 각 일반 명사를 해당 직무의 실제 산출물·도구·지표 이름으로 교체
  [단계 3] 자가 점검 — 직무 키워드 단순 접두 / 일반 명사 잔존 / 타 직무에도 적용 가능한 수준 → 재작성

[품질 기준 — "키워드 접두" ≠ "진짜 맞춤"]

나쁜 예 (게임 기획자 대상):
  원본:    "[실습] 이메일·기획서·제안서·보고서 초안 작성"
  나쁨:    "[실습] 게임 이메일·게임 기획서·게임 제안서·게임 보고서 초안 작성"

좋은 예 (게임 기획자 대상):
  원본:    "[실습] 이메일·기획서·제안서·보고서 초안 작성"
  좋음:    "[실습] GDD(Game Design Document)·PRD·패치 노트·밸런스 조정 리포트 초안 작성"

좋은 예 (퍼포먼스 마케터 대상):
  원본:    "[실습] 외부 데이터 분석·예측 (환율·원자재 동향 등) 기반 보고서 초안 생성"
  좋음:    "[실습] GA4·Meta Ads·Google Ads 매체 리포트 데이터 분석 기반 주간 퍼포먼스 리포트 초안 생성"

좋은 예 (HR 담당자 대상):
  원본:    "- 시장조사·경쟁사 동향 요약 및 인사이트 도출"
  좋음:    "- 동종 업계 보상 벤치마크·경쟁사 채용 공고·이직률 지표 리서치를 통한 인사 전략 인사이트 도출"

좋은 예 (데이터 분석가 대상):
  원본:    "- 문서/보고서 초안 자동 생성 (제목·목차·본문 구조화)"
  좋음:    "- 분석 리포트·대시보드 설명서·A/B 테스트 결과서 초안 자동 생성 (배경·가설·검증·결론 구조화)"

좋은 예 (게임 기획자 대상):
  원본:    "- [실습] 대규모 파일 요약·정리"
  좋음:    "- [실습] 수백 페이지 규모의 기존 GDD·유저 리서치 자료·QA 이슈 로그 요약·정리"

좋은 예 (게임 기획자 대상):
  원본:    "- 시장조사·경쟁사 동향 요약 및 인사이트 도출"
  좋음:    "- 경쟁 타이틀 업데이트 노트·장르별 메타 트렌드·글로벌 플랫폼 매출 동향 리서치를 통한 기획 인사이트 도출"

좋은 예 (게임 기획자 대상):
  원본:    "- [실습] 외부 데이터 분석·예측 (환율·원자재 동향 등) 기반 보고서 초안 생성"
  좋음:    "- [실습] DAU·리텐션·매출 지표 등 라이브 게임 운영 데이터 해석 기반, 차기 콘텐츠 우선순위 제안 리포트 초안 생성"

[환각 방지 규칙 — 가장 중요한 안전 규정]

핵심 원칙: **공개 정보는 적극 활용**하고, **내부 정보는 추측 금지**.

**규칙 1-A. 공개 정보는 적극 활용할 것 (구체성의 핵심)**

활용 권장 — 구글 검색으로 쉽게 확인되는 공개된 회사 정보:
- 주요 브랜드명·제품명 (예: LG생활건강의 "후·오휘·숨37°·페리오·엘라스틴", 크래프톤의 "PUBG·배틀그라운드·뉴스테이트", F&F의 "MLB·Discovery Expedition", BGF리테일의 "CU 편의점")
- 공개된 제품 카테고리·사업 영역 (예: 한국타이어의 "한국타이어·라우펜", 편의점 PB 상품)
- 회사가 속한 산업·시장 포지션 (예: "프레스티지 K-뷰티", "편의점 업계 1~2위", "글로벌 타이어 제조 TOP 10")
- 공개된 사업 전략 방향 (예: "글로벌 프리미엄 확대", "PB 상품 강화", "K-패션 글로벌 확장")

이런 공개 정보는 **적극 활용**해서 실무자가 "내 회사 얘기네"라고 느낄 수 있는 **진짜 맞춤 느낌**을 만들어야 합니다. "LG생활건강 제품"처럼 회사명만 붙이고 끝나면 부족합니다.

**규칙 1-B. 내부 정보는 지어내지 말 것**

여전히 금지 — 출처 확인이 어려운 내부 정보:
- 회사 내부 플랫폼·시스템·도구 이름 (예: "네이버 데이터 플랫폼" X — 실존 확인 불가)
- 회사 내부 조직·팀명 (예: "크래프톤 PUBG 기획 3팀" X)
- 비공개 재무·매출·사용자 수치 (예: "LG생활건강 MAU 500만" X)
- 미출시·미공개 제품·계획 (예: "2026년 하반기 출시 예정 신제품" X)
- 확실하지 않은 내부 업무 프로세스 (예: "BGF리테일 상품기획팀 주간 리뷰" X)

**판단 기준**: 구글에서 "회사명 + 키워드"로 검색했을 때 확인되면 → 활용 OK. 내부자만 알만한 정보 → 금지.

좋은 예 (공개 브랜드 활용 + 환각 회피):
  LG생활건강 브랜드 마케터: "[실습] 후·오휘·숨37° 프레스티지 화장품 키비주얼, 페리오·엘라스틴 생활용품 광고 카피·이미지 프롬프트 설계"
    → 공개 브랜드 포트폴리오 활용. 내부 시스템 언급 없음. 구체적이고 안전.
  크래프톤 게임 기획자: "[실습] 배틀그라운드·뉴스테이트 장르의 GDD·패치 노트·밸런스 조정 리포트 초안 작성"
    → 공개 IP 활용. 내부 조직·시스템 언급 없음.
  BGF리테일 MD: "[실습] CU 자체 상품(PB) 기획서·신상품 도입 검토 리포트·편의점 카테고리별 매출 분석 리포트 초안 작성"
    → 공개 브랜드·사업 영역 활용.
  F&F 디자이너: "[실습] MLB·Discovery Expedition 시즌별 무드보드·컬러 팔레트·프린트 패턴 프롬프트 설계"
    → 공개 브랜드·제품 라인 활용.

나쁜 예 (환각):
  네이버 데이터 분석가: "[실습] 네이버 데이터 플랫폼·네이버 비즈니스 플랫폼 초안 작성" — 내부 시스템명 추측. 금지.
  삼성생명 HR: "[실습] 삼성생명 HR 시스템·삼성 인사 플랫폼 활용" — 내부 시스템명 추측. 금지.

나쁜 예 (공개 정보 미활용 — 이것도 불충분):
  LG생활건강 마케터: "[실습] LG생활건강 제품 이미지 생성 및 브랜드 스타일 적용"
    → 회사명만 접두. 실제 브랜드(후·오휘) 언급 없음. **구체성 부족**.

**규칙 2. 허용되는 구체 용어 — 이 리스트 안에서 선택**

게임 업계: GDD, PRD, 패치 노트, QA 이슈 로그, 밸런스 조정 리포트, 레벨 디자인 문서, 유저 리서치, DAU, MAU, 리텐션, ARPU, 매출 지표, 플랫폼별 매출, 장르 메타, 업데이트 노트

마케팅 업계: GA4, Meta Ads, Google Ads, TikTok Ads, 캠페인 브리프, 퍼포먼스 리포트, 주간 매체 리포트, CTR, CPC, CPA, CPM, ROAS, 전환율, 리마케팅, A/B 테스트

HR 업계: 채용 공고, 직무 기술서, 면접 질문지, 평가 보고서, 보상 벤치마크, 이직률, 직원 만족도 설문, 승진 심사서, 온보딩 플랜, 인사 규정집, 채용 KPI

데이터 분석: SQL 쿼리, 대시보드, A/B 테스트 결과서, 분석 리포트, 가설 검증, 데이터 퀄리티 체크, 로그 데이터, 유저 행동 데이터, EDA, 회귀 분석, 코호트 분석, 퍼널 분석

범용 도구: Notion, Slack, Jira, Confluence, Figma, Excel, Google Sheets, Tableau, Power BI, GitHub, ChatGPT, Claude, Gemini, Perplexity

**규칙 3. 회사명 사용 원칙**
- 회사명은 맥락(어떤 업종·스케일인지)으로만 활용
- 회사명에 일반 명사를 붙여 내부 제품처럼 표현하지 말 것 ("네이버 데이터 플랫폼" X)
- 회사명 언급 없이 직무 표준 용어만으로 불릿을 작성하는 것이 안전한 기본값

**규칙 4. 자가 점검**
각 불릿 작성 후:
- "이 이름이 정말 해당 회사의 실제 제품·시스템인가?" 확신 없으면 → 업계 표준 용어로 교체
- "이 용어가 구글 검색에서 쉽게 확인되는가?" 아니면 → 일반화
- 확신 못 할 때는 구체성을 포기하고 안전하게 가세요

[JSON 출력 문법 규칙 — 매우 중요]
응답 전체는 반드시 유효한 JSON 객체 하나여야 합니다. 다음 규칙을 엄격히 지키세요:

1. customizedContent 문자열 안에서 인용이나 예시를 표기할 때는 **홑따옴표(')** 또는 **한국어 꺾쇠(「」, ',')** 만 사용하세요.
2. JSON 구조의 키·값 경계를 나타내는 이중 따옴표(")는 JSON 문법에서만 사용하고, 문자열 값 내부에는 절대 쓰지 마세요. 내부에서 이중 따옴표를 쓰면 파싱 실패로 전체 응답이 버려집니다.
3. Markdown 코드 펜스(\`\`\`)로 감싸지 마세요.
4. JSON 외 서문·설명·후기를 출력하지 마세요.

나쁜 예 (이중 따옴표 중첩 → 파싱 실패):
  "customizedContent": "근본 목표: "결과물 확률 높이기"와 반복적 개선"
  "customizedContent": "핵심 워크플로우: 자연어 지시 (예: "월별 집계표를 만들어줘")"

좋은 예 (홑따옴표):
  "customizedContent": "근본 목표: '결과물 확률 높이기'와 반복적 개선"
  "customizedContent": "핵심 워크플로우: 자연어 지시 (예: '월별 집계표를 만들어줘')"

좋은 예 (한국어 꺾쇠):
  "customizedContent": "근본 목표: 「결과물 확률 높이기」와 반복적 개선"

[금지 — 최종 체크리스트]
다음 중 하나라도 해당하면 해당 불릿을 재작성하세요:
- 회사명 + 추정 제품명 조합 (최우선 금지)
- "게임 [명사]", "마케팅 [명사]", "인사 [명사]" 같은 단순 접두 패턴
- 원본의 "문서/데이터/보고서/자료/정보/파일" 등이 그대로 남은 경우
- "~기획서·~디자인 문서·~보고서" 처럼 뻔한 접두 나열
- 일반 명사 대비 구체적 산출물 이름이 1개도 등장하지 않는 불릿
- 직무 3년차가 "이건 그냥 아무 직무에나 해당되는 일반 설명"이라고 느낄 추상 수준
- 한국어 외 문자 (일본어 히라가나·가타카나, 간체 한자 등) 혼입
- 출처 확인 어려운 임의 도구·시스템명 언급
- 모듈명·시수·Tool 변경
- 불릿 개수 변경
- customizedContent 문자열 내부에 이중 따옴표(") 사용 (홑따옴표 ' 또는 꺾쇠 「」 로 교체)`;

function buildBatchPrompt({ company, role, level, audience, topicCode, topicName, modules }) {
  const moduleBlocks = modules
    .map(
      (m, i) => `---
모듈 ${i + 1}
- ID: ${m.id}
- 이름: ${m.name}
- 시수: ${m.hours}H
- 난이도: ${m.difficulty}
- Tool: ${m.tool}
- 원본 학습 내용:
${m.originalContent}`
    )
    .join('\n\n');

  return `[고객사 맥락]
- 회사: ${company}
- 직무: ${role}
- 난이도: ${level}
- 교육 대상: ${audience}

[주제]
- 코드: ${topicCode}
- 이름: ${topicName}

[재작성 대상 모듈들] (총 ${modules.length}개)
각 모듈의 원본 학습 내용을 ${company} ${role} 직무 맥락으로 재작성하세요.

${moduleBlocks}

[JSON 응답 형식 — 이 스키마 엄격히 준수]
{
  "modules": [
    {
      "id": "모듈 ID",
      "customizedContent": "재작성된 학습 내용 (원본 불릿 개수 동일 유지)"
    }
  ]
}

modules 배열에는 입력된 ${modules.length}개 모듈에 대한 재작성 결과가 모두 포함되어야 합니다.
JSON 외 다른 설명·서문·후기를 절대 출력하지 마세요. Markdown 코드 펜스(\`\`\`)로 감싸지 마세요.
customizedContent 문자열 내부에 인용·예시를 쓸 때는 반드시 홑따옴표(') 또는 꺾쇠(「」)만 사용하세요. 이중 따옴표(")는 JSON 문법에서만 쓰고 문자열 값 안에는 절대 넣지 마세요.`;
}

// ====================================================================
// 서버사이드 detector (로그용, UI 미노출)
// ====================================================================
function detectMultilingualErrors(text) {
  const errors = [];
  const hiragana = text.match(/[\u3040-\u309F]/g);
  if (hiragana) errors.push({ type: 'hiragana', count: hiragana.length, chars: [...new Set(hiragana)].join('') });
  const katakana = text.match(/[\u30A0-\u30FF]/g);
  if (katakana) errors.push({ type: 'katakana', count: katakana.length, chars: [...new Set(katakana)].join('') });
  const cjkRuns = text.match(/[\u4E00-\u9FFF]{2,}/g);
  if (cjkRuns) errors.push({ type: 'cjk_run', count: cjkRuns.length, examples: cjkRuns.slice(0, 3) });
  return errors;
}

function detectHallucinationPatterns(text, company) {
  const warnings = [];
  const suspiciousSuffixes = ['플랫폼', '시스템', '솔루션', '툴', '서비스', '엔진'];
  for (const suffix of suspiciousSuffixes) {
    const pattern = new RegExp(`${company}\\s*[가-힣A-Za-z]{0,10}\\s*${suffix}`, 'g');
    const matches = text.match(pattern);
    if (matches) warnings.push({ suffix, count: matches.length, examples: matches.slice(0, 2) });
  }
  return warnings;
}

function countBullets(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('-')).length;
}

function runDetectors(parsedModules, originalModules, company) {
  const report = [];
  for (const m of parsedModules) {
    const original = originalModules.find((o) => o.id === m.id);
    if (!original) {
      report.push({ id: m.id, issue: 'UNKNOWN_MODULE_ID' });
      continue;
    }
    const originalCount = countBullets(original.originalContent);
    const newCount = countBullets(m.customizedContent);
    const allText = m.customizedContent ?? '';

    const ml = detectMultilingualErrors(allText);
    const hall = detectHallucinationPatterns(allText, company);
    const bulletMismatch = newCount !== originalCount;

    if (ml.length || hall.length || bulletMismatch) {
      report.push({
        id: m.id,
        bulletMismatch: bulletMismatch ? `${originalCount}->${newCount}` : null,
        multilingual: ml.length ? ml : null,
        hallucination: hall.length ? hall : null,
      });
    }
  }
  return report;
}

function stripCodeFence(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
}

// ====================================================================
// Anthropic 클라이언트 (모듈 레벨 — Vercel이 ANTHROPIC_API_KEY 자동 주입)
// ====================================================================
const client = new Anthropic();

// ====================================================================
// 핸들러
// ====================================================================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[customize-curriculum] ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { company, role, level, audience, topicCode, topicName, modules } = req.body ?? {};

  if (!company || !role || !level || !audience || !topicCode || !Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['company', 'role', 'level', 'audience', 'topicCode', 'modules (non-empty array)'],
    });
  }

  // 시스템 프롬프트 캐싱으로 중복 전송 비용은 해결되지만, latency 관점에서 단일 호출이 여전히 유리.
  // 11개 이하는 단일 호출, 12개 이상만 분할.
  const SINGLE_CALL_THRESHOLD = 11;
  const batches = [];
  if (modules.length <= SINGLE_CALL_THRESHOLD) {
    batches.push(modules);
  } else {
    for (let i = 0; i < modules.length; i += SINGLE_CALL_THRESHOLD) {
      batches.push(modules.slice(i, i + SINGLE_CALL_THRESHOLD));
    }
  }
  console.log(`[customize-curriculum] ${modules.length} modules → ${batches.length} batch(es) (threshold: single call ≤${SINGLE_CALL_THRESHOLD})`);

  const callClaudeForBatch = async (batchModules) => {
    const userPrompt = buildBatchPrompt({
      company,
      role,
      level,
      audience,
      topicCode,
      topicName,
      modules: batchModules,
    });

    // max_tokens: 모듈 수에 비례 (모듈당 약 500 토큰 여유 + 최소 1024)
    const adaptiveMaxTokens = Math.min(8192, Math.max(1024, batchModules.length * 500 + 600));

    return await client.messages.create({
      model: MODEL,
      max_tokens: adaptiveMaxTokens,
      temperature: 0.4,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
      // Structured Outputs: 모델 레벨에서 JSON 문법 유효성을 강제.
      // customizedContent 문자열 내부의 escape 누락·잘린 JSON·preamble 등
      // 전반적인 파싱 실패 케이스를 원천 차단함.
      output_config: {
        format: {
          type: 'json_schema',
          name: 'customized_modules',
          schema: {
            type: 'object',
            properties: {
              modules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    customizedContent: { type: 'string' },
                  },
                  required: ['id', 'customizedContent'],
                  additionalProperties: false,
                },
              },
            },
            required: ['modules'],
            additionalProperties: false,
          },
        },
      },
    });
  };

  const started = Date.now();
  const allModules = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheWriteTokens = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let response;
    try {
      response = await callClaudeForBatch(batch);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        const retryAfter = Number(err.headers?.['retry-after'] ?? 60);
        console.error(`[customize-curriculum] rate limit on batch ${i + 1}/${batches.length}, retry after ${retryAfter}s`);
        return res.status(429).json({
          error: `요청이 많아 잠시 대기가 필요합니다. ${retryAfter}초 후 다시 시도해주세요.`,
          retryAfter,
          partialProgress: allModules.length,
        });
      }
      if (err instanceof Anthropic.AuthenticationError) {
        console.error('[customize-curriculum] authentication error:', err.message);
        return res.status(500).json({ error: 'AI 인증 오류가 발생했습니다. 관리자에게 문의해주세요.' });
      }
      if (err instanceof Anthropic.BadRequestError) {
        console.error(`[customize-curriculum] bad request on batch ${i + 1}:`, err.message);
        return res.status(400).json({ error: '요청 형식 오류가 발생했습니다.' });
      }
      if (err instanceof Anthropic.APIError) {
        console.error(`[customize-curriculum] API error ${err.status} on batch ${i + 1}:`, err.message);
        return res.status(502).json({ error: 'AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
      }
      console.error(`[customize-curriculum] network error on batch ${i + 1}/${batches.length}:`, err);
      return res.status(502).json({ error: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawContent = textBlock?.text;
    if (!rawContent) {
      console.error(`[customize-curriculum] empty content on batch ${i + 1}:`, JSON.stringify(response));
      return res.status(502).json({ error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' });
    }

    const content = stripCodeFence(rawContent);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error(`[customize-curriculum] JSON parse failed on batch ${i + 1}:`, content);
      return res.status(502).json({ error: 'AI 응답 형식 오류입니다. 다시 시도해주세요.' });
    }
    if (!Array.isArray(parsed.modules)) {
      console.error(`[customize-curriculum] missing modules array on batch ${i + 1}:`, parsed);
      return res.status(502).json({ error: 'AI 응답 구조 오류입니다. 다시 시도해주세요.' });
    }

    allModules.push(...parsed.modules);
    totalInputTokens += response.usage?.input_tokens ?? 0;
    totalOutputTokens += response.usage?.output_tokens ?? 0;
    totalCacheReadTokens += response.usage?.cache_read_input_tokens ?? 0;
    totalCacheWriteTokens += response.usage?.cache_creation_input_tokens ?? 0;

    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const elapsed = Date.now() - started;

  const detectorReport = runDetectors(allModules, modules, company);
  if (detectorReport.length > 0) {
    console.warn(
      '[customize-curriculum] quality issues:',
      JSON.stringify({ company, role, elapsedMs: elapsed, batches: batches.length, report: detectorReport }, null, 2)
    );
  } else {
    console.log(
      '[customize-curriculum] OK:',
      JSON.stringify({
        company,
        role,
        moduleCount: modules.length,
        batches: batches.length,
        elapsedMs: elapsed,
        tokens: {
          input: totalInputTokens,
          output: totalOutputTokens,
          cacheRead: totalCacheReadTokens,
          cacheWrite: totalCacheWriteTokens,
        },
      })
    );
  }

  return res.status(200).json({
    customizedModules: allModules,
    elapsedMs: elapsed,
  });
}
