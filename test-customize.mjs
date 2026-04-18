import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}
loadEnv();

const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error('[ERROR] GROQ_API_KEY 가 설정되어 있지 않습니다.');
  process.exit(1);
}

const MODEL = 'llama-3.3-70b-versatile';

// ====================================================================
// 테스트 케이스: 다양한 직무로 일반화 능력 검증
// ====================================================================
const TEST_CASES = [
  {
    label: '케이스 1 — 게임 기획자 (기준선, few-shot 풍부)',
    company: '크래프톤',
    role: '게임 기획자',
    level: '중급',
    audience: '기획 경력 3~5년, AI 경험 적음',
    topicCode: 'N1',
    topicName: '생성형 AI 업무 활용 기초',
    moduleId: 'N1-M03',
  },
  {
    label: '케이스 2 — 퍼포먼스 마케터 (few-shot 1개)',
    company: '현대카드',
    role: '퍼포먼스 마케터',
    level: '중급',
    audience: '마케팅 경력 2~4년, GA4·광고 매체 경험 있음, AI 초보',
    topicCode: 'N1',
    topicName: '생성형 AI 업무 활용 기초',
    moduleId: 'N1-M03',
  },
  {
    label: '케이스 3 — HR 담당자 (few-shot 1개)',
    company: '삼성생명',
    role: 'HR 담당자',
    level: '입문',
    audience: '인사 실무 경력 5년, AI 처음 접함',
    topicCode: 'N1',
    topicName: '생성형 AI 업무 활용 기초',
    moduleId: 'N1-M03',
  },
  {
    label: '케이스 4 — 데이터 분석가 (few-shot 1개, 고급 난이도)',
    company: '네이버',
    role: '데이터 분석가',
    level: '고급',
    audience: '분석 경력 5년+, SQL·Python 능숙, AI 활용 경험 있음',
    topicCode: 'N1',
    topicName: '생성형 AI 업무 활용 기초',
    moduleId: 'N1-M03',
  },
];

const modules = JSON.parse(
  readFileSync(resolve(__dirname, 'src/data/moduleMaster.json'), 'utf8')
);

// ====================================================================
// 프롬프트 (튜닝된 버전)
// ====================================================================
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

[작업 방식 — 각 불릿마다 독립적으로 3단계 수행]
**중요**: 첫 불릿만 잘 하고 나머지 불릿을 대충 하는 것은 실패입니다. 모든 불릿에 동일한 퀄리티를 적용하세요.

각 불릿을 처리할 때 내부적으로 다음 3단계를 반드시 거치세요:
  [단계 1] 원본 불릿의 일반 명사 찾기
    - 대상: "문서"·"데이터"·"보고서"·"자료"·"정보"·"파일"·"외부 데이터"·"시장"·"경쟁사 동향" 등
  [단계 2] 각 일반 명사를 해당 직무의 실제 산출물·도구·지표 이름으로 교체
  [단계 3] 자가 점검 — 직무 키워드 단순 접두 / 일반 명사 잔존 / 타 직무에도 적용 가능한 수준 → 재작성

[품질 기준 — "키워드 접두" ≠ "진짜 맞춤"]

나쁜 예 (게임 기획자 대상):
  원본:    "[실습] 이메일·기획서·제안서·보고서 초안 작성"
  나쁨:    "[실습] 게임 이메일·게임 기획서·게임 제안서·게임 보고서 초안 작성"
    → "게임"만 접두. 금지.

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

모르는 것에 대해 그럴듯한 가짜 이름을 만들지 마세요. 확신이 없으면 **업계 표준 용어로 후퇴**하는 것이 정답입니다.

**규칙 1. 회사 내부 제품·도구·플랫폼 이름을 지어내지 말 것**
- "[회사명] + 플랫폼/시스템/도구/리포트" 형태로 가상의 내부 제품명을 생성하는 것은 **엄격히 금지**
- 회사 내부 도구·제품의 실제 이름을 확신할 수 없다면, **업계 표준 도구나 일반 설명**으로 대체

나쁜 예 (환각):
  네이버 데이터 분석가 대상: "[실습] 네이버 데이터 플랫폼·네이버 비즈니스 플랫폼·네이버 광고 리포트 초안 작성"
    → "네이버 데이터 플랫폼"이 실제 제품인지 확인 불가. 환각 가능성 높음. **금지**.
  크래프톤 기획자 대상: "[실습] 크래프톤 PUBG GDD·크래프톤 배그 밸런스 시스템 작성"
    → 내부 명칭·시스템 이름 추측. **금지**.
  삼성생명 HR 대상: "[실습] 삼성생명 인사 시스템·삼성 HR 플랫폼 활용"
    → 내부 시스템명 지어내기. **금지**.

좋은 예 (환각 회피):
  네이버 데이터 분석가 대상: "[실습] SQL 쿼리 결과 리포트·대시보드 설명서·A/B 테스트 결과서 초안 작성"
    → 데이터 분석가 **일반 표준 산출물**. 회사명 없음. 안전.
  크래프톤 기획자 대상: "[실습] GDD·PRD·패치 노트·밸런스 조정 리포트 초안 작성"
    → 게임 업계 **표준 산출물명**. 특정 IP 언급 없음. 안전.
  삼성생명 HR 대상: "[실습] 승진 심사서·인사 평가 리포트·채용 면접 질문지 초안 작성"
    → HR 업계 **일반 업무 산출물**. 회사 내부 시스템 언급 없음. 안전.

**규칙 2. 허용되는 구체 용어 — 이 리스트 안에서 선택**

게임 업계: GDD, PRD, 패치 노트, QA 이슈 로그, 밸런스 조정 리포트, 레벨 디자인 문서, 유저 리서치, DAU, MAU, 리텐션, ARPU, 매출 지표, 플랫폼별 매출, 장르 메타, 업데이트 노트

마케팅 업계: GA4, Meta Ads, Google Ads, TikTok Ads, 캠페인 브리프, 퍼포먼스 리포트, 주간 매체 리포트, CTR, CPC, CPA, CPM, ROAS, 전환율, 리마케팅, A/B 테스트

HR 업계: 채용 공고, 직무 기술서, 면접 질문지, 평가 보고서, 보상 벤치마크, 이직률, 직원 만족도 설문, 승진 심사서, 온보딩 플랜, 인사 규정집, 채용 KPI

데이터 분석: SQL 쿼리, 대시보드, A/B 테스트 결과서, 분석 리포트, 가설 검증, 데이터 퀄리티 체크, 로그 데이터, 유저 행동 데이터, EDA, 회귀 분석, 코호트 분석, 퍼널 분석

범용 도구: Notion, Slack, Jira, Confluence, Figma, Excel, Google Sheets, Tableau, Power BI, GitHub, ChatGPT, Claude, Gemini, Perplexity

**규칙 3. 회사명 사용 원칙**
- 회사명은 **맥락(어떤 업종·스케일인지)으로만 활용**
- 회사명에 일반 명사를 붙여 내부 제품처럼 표현하지 말 것 ("네이버 데이터 플랫폼" X)
- 회사명 언급 없이 직무 표준 용어만으로 불릿을 작성하는 것이 **안전한 기본값**

**규칙 4. 자가 점검**
각 불릿 작성 후:
- "이 이름이 정말 해당 회사의 실제 제품·시스템인가?" 확신 없으면 → 업계 표준 용어로 교체
- "이 용어가 구글 검색에서 쉽게 확인되는가?" 아니면 → 일반화
- 확신 못 할 때는 **구체성을 포기하고 안전하게** 가세요

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
- 불릿 개수 변경`;

function buildUserPrompt(tc, target) {
  return `[고객사 맥락]
- 회사: ${tc.company}
- 직무: ${tc.role}
- 난이도: ${tc.level}
- 교육 대상: ${tc.audience}

[주제]
- 코드: ${tc.topicCode}
- 이름: ${tc.topicName}

[재작성 대상 모듈]
- 모듈 ID: ${target.모듈ID}
- 모듈명: ${target.모듈명}
- 시수: ${target.기본시수}H
- 난이도: ${target.난이도}

[원본 학습 내용]
${target.학습내용}

[요청]
위 모듈의 학습 내용을 ${tc.company} ${tc.role} 직무 맥락으로 재작성하고, 별도로 "실습 주제" 한 줄 요약을 덧붙여주세요.

[JSON 응답 형식]
{
  "customizedContent": "- 불릿1\\n- 불릿2\\n...",
  "customizedPracticeTopic": "실습 주제 한 줄 요약"
}

JSON 외 다른 설명·서문·후기를 절대 출력하지 마세요.`;
}

// ====================================================================
// 다국어 오류 detector + 품질 validator
// ====================================================================
function detectMultilingualErrors(text) {
  const errors = [];

  const hiragana = text.match(/[\u3040-\u309F]/g);
  if (hiragana && hiragana.length > 0) {
    const unique = [...new Set(hiragana)];
    errors.push({
      severity: 'HIGH',
      type: '히라가나 혼입',
      chars: unique.join(' '),
      detail: `일본어 히라가나 ${hiragana.length}회 등장 (문자: ${unique.join(', ')})`,
    });
  }

  const katakana = text.match(/[\u30A0-\u30FF]/g);
  if (katakana && katakana.length > 0) {
    const unique = [...new Set(katakana)];
    errors.push({
      severity: 'HIGH',
      type: '가타카나 혼입',
      chars: unique.join(' '),
      detail: `일본어 가타카나 ${katakana.length}회 등장 (문자: ${unique.join(', ')})`,
    });
  }

  const cjkRuns = text.match(/[\u4E00-\u9FFF]{2,}/g);
  if (cjkRuns && cjkRuns.length > 0) {
    errors.push({
      severity: 'MEDIUM',
      type: '한자 연속 출현',
      chars: cjkRuns.join(', '),
      detail: `2자 이상 연속 한자 ${cjkRuns.length}건 — 간체/번체 중국어 가능성 (예: ${cjkRuns.slice(0, 3).join(', ')})`,
    });
  }

  return errors;
}

function countBullets(text) {
  const lines = text.split('\n').map((l) => l.trim());
  return lines.filter((l) => l.startsWith('-')).length;
}

function detectSurfacePrefixPatterns(text, role) {
  const roleCore = role.replace(/담당자|매니저|엔지니어|기획자|분석가|마케터/g, '').trim();
  const keywords = [roleCore, '게임', '마케팅', '인사', '분석', '디자인'].filter(Boolean);

  const warnings = [];
  const genericNouns = ['문서', '데이터', '보고서', '자료', '정보', '파일'];

  for (const kw of keywords) {
    for (const gn of genericNouns) {
      const pattern = new RegExp(`${kw}\\s*${gn}`, 'g');
      const matches = text.match(pattern);
      if (matches) {
        warnings.push(`"${kw} ${gn}" 패턴 ${matches.length}회 발견 — 키워드 단순 접두 의심`);
      }
    }
  }

  return warnings;
}

function detectHallucinationPatterns(text, company) {
  const warnings = [];
  const suspiciousSuffixes = ['플랫폼', '시스템', '솔루션', '툴', '서비스', '엔진'];
  for (const suffix of suspiciousSuffixes) {
    const pattern = new RegExp(`${company}\\s*[가-힣A-Za-z]{0,10}\\s*${suffix}`, 'g');
    const matches = text.match(pattern);
    if (matches) {
      warnings.push({
        severity: 'MEDIUM',
        type: '회사 내부 제품명 환각 의심',
        detail: `"${company} … ${suffix}" 패턴 ${matches.length}회 (${matches.slice(0, 2).join(', ')}) — 실존 여부 검수 필요`,
      });
    }
  }
  return warnings;
}

function validateOutput(parsed, originalBulletCount, role, company) {
  const issues = [];

  const newBullets = countBullets(parsed.customizedContent);
  if (newBullets !== originalBulletCount) {
    issues.push({
      severity: 'HIGH',
      type: '불릿 개수 불일치',
      detail: `원본 ${originalBulletCount}개 → 맞춤 ${newBullets}개`,
    });
  }

  const allText = parsed.customizedContent + '\n' + parsed.customizedPracticeTopic;

  const mlErrors = detectMultilingualErrors(allText);
  issues.push(...mlErrors);

  const hallWarns = detectHallucinationPatterns(allText, company);
  issues.push(...hallWarns);

  const prefixWarns = detectSurfacePrefixPatterns(allText, role);
  for (const w of prefixWarns) {
    issues.push({ severity: 'LOW', type: '표면 접두 의심', detail: w });
  }

  return issues;
}

// ====================================================================
// API 호출
// ====================================================================
async function callGroq(systemPrompt, userPrompt) {
  const started = Date.now();
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const elapsed = (Date.now() - started) / 1000;
  return { data, elapsed };
}

// ====================================================================
// 메인 실행
// ====================================================================
const SEP = '='.repeat(74);
const HR = '-'.repeat(74);

console.log(SEP);
console.log(`[다중 직무 검증 테스트 — 모델: ${MODEL}]`);
console.log(SEP);
console.log(`테스트 케이스 ${TEST_CASES.length}개를 순차 실행합니다.`);
console.log('');

const summary = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let idx = 0; idx < TEST_CASES.length; idx++) {
  const tc = TEST_CASES[idx];
  if (idx > 0) {
    console.log('  [TPM 한도 회피 대기 10초]');
    console.log('');
    await sleep(10000);
  }
  const target = modules.find((m) => m.모듈ID === tc.moduleId);
  if (!target) {
    console.error(`[SKIP] 모듈 ${tc.moduleId} 미존재`);
    continue;
  }
  const originalBulletCount = countBullets(target.학습내용);

  console.log(SEP);
  console.log(`▶ ${tc.label}`);
  console.log(SEP);
  console.log(`고객사   : ${tc.company}  /  직무: ${tc.role}`);
  console.log(`난이도   : ${tc.level}`);
  console.log(`교육 대상 : ${tc.audience}`);
  console.log(`모듈    : ${target.모듈ID} ${target.모듈명} (${target.기본시수}H, 원본 불릿 ${originalBulletCount}개)`);
  console.log('');

  const userPrompt = buildUserPrompt(tc, target);

  let result;
  try {
    result = await callGroq(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    console.error(`[ERROR] ${e.message}`);
    summary.push({ label: tc.label, failed: true });
    continue;
  }

  const { data, elapsed } = result;
  const content = data.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error(`[ERROR] JSON 파싱 실패: ${content}`);
    summary.push({ label: tc.label, failed: true });
    continue;
  }

  console.log(`[맞춤 학습 내용]   (응답 ${elapsed.toFixed(1)}s)`);
  console.log(parsed.customizedContent);
  console.log('');
  console.log(`[맞춤 실습 주제]`);
  console.log(parsed.customizedPracticeTopic);
  console.log('');

  const issues = validateOutput(parsed, originalBulletCount, tc.role, tc.company);

  console.log('[검증 결과]');
  if (issues.length === 0) {
    console.log('  ✓ 검출된 이슈 없음');
  } else {
    const highs = issues.filter((i) => i.severity === 'HIGH');
    const meds = issues.filter((i) => i.severity === 'MEDIUM');
    const lows = issues.filter((i) => i.severity === 'LOW');

    if (highs.length > 0) {
      console.log(`  [HIGH ${highs.length}]`);
      highs.forEach((i) => console.log(`    - ${i.type}: ${i.detail}`));
    }
    if (meds.length > 0) {
      console.log(`  [MEDIUM ${meds.length}]`);
      meds.forEach((i) => console.log(`    - ${i.type}: ${i.detail}`));
    }
    if (lows.length > 0) {
      console.log(`  [LOW ${lows.length}]`);
      lows.forEach((i) => console.log(`    - ${i.type}: ${i.detail}`));
    }
  }

  const tokens = data.usage ?? {};
  console.log('');
  console.log(`[토큰]  in ${tokens.prompt_tokens ?? 0}  /  out ${tokens.completion_tokens ?? 0}  /  total ${tokens.total_tokens ?? 0}`);
  console.log('');

  summary.push({
    label: tc.label,
    elapsed,
    tokens: tokens.total_tokens ?? 0,
    issues: issues.length,
    high: issues.filter((i) => i.severity === 'HIGH').length,
    med: issues.filter((i) => i.severity === 'MEDIUM').length,
    low: issues.filter((i) => i.severity === 'LOW').length,
    failed: false,
  });
}

// ====================================================================
// 요약
// ====================================================================
console.log(SEP);
console.log('[전체 요약]');
console.log(SEP);
console.log('케이스'.padEnd(44) + '시간     토큰    HIGH  MED  LOW');
console.log(HR);
for (const s of summary) {
  if (s.failed) {
    console.log(`${s.label.padEnd(44)}FAILED`);
  } else {
    console.log(
      `${s.label.padEnd(44)}${s.elapsed.toFixed(1)}s`.padEnd(54) +
        `${String(s.tokens).padEnd(8)}${String(s.high).padEnd(6)}${String(s.med).padEnd(5)}${s.low}`
    );
  }
}
console.log('');

const totalHigh = summary.reduce((a, s) => a + (s.high ?? 0), 0);
const totalMed = summary.reduce((a, s) => a + (s.med ?? 0), 0);
const totalLow = summary.reduce((a, s) => a + (s.low ?? 0), 0);
console.log(`전체 이슈 합계: HIGH ${totalHigh}  /  MEDIUM ${totalMed}  /  LOW ${totalLow}`);
console.log('');
console.log('[판정 가이드]');
console.log('  HIGH = 0           → 프로덕션 수용 가능');
console.log('  HIGH 1~2, MED < 3  → 프로덕션에 가벼운 검수 추가하면 OK');
console.log('  HIGH 3+ 또는 MED 5+ → 프롬프트 추가 튜닝 또는 Claude 전환 검토');
console.log('');
console.log('[비용]  전체 호출 비용: 0원 (Groq 무료 티어)');
