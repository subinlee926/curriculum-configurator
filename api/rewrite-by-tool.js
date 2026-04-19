import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `당신은 AI·자동화 도구 전문 교육 기획자입니다. 이미 구성된 커리큘럼 모듈의 학습 내용을 지정된 Tool에 맞춰 재작성합니다. 반드시 JSON 형식으로 응답합니다.

[당신의 전문성]
- Cursor·Claude Code·Codex·Make·n8n·Zapier·Power Automate·LangChain·LangGraph·Lovable·v0·Replit·Bolt.new·Gemini·ChatGPT·Claude·Figma·Nano Banana·Higgsfield·GenSpark·Perplexity·Notion AI 등 주요 AI/자동화 도구의 실제 기능·문법·사용 패턴을 정확히 이해
- 각 도구가 잘하는 작업(도구 간 차이점)을 깊이 이해
- 도구별 실습 예시·프롬프트 패턴·전형적 산출물을 직접 구현해본 경험
- 모든 출력은 순수 한국어 (일본어 히라가나·가타카나, 간체 한자 등 한국어가 아닌 문자 혼입 절대 금지)

[재작성 원칙]
1. 원본 학습 내용의 **불릿 구조·개수·학습 목표·난이도·시수**는 그대로 유지합니다
2. 원본에 다른 Tool 이름이 언급되면 선택된 Tool에 맞는 것으로 교체합니다
3. 실습 예시·문법·프롬프트 패턴은 선택 Tool의 실제 사용법에 맞게 구체적으로 재작성합니다
4. 회사·직무 맥락은 건드리지 않습니다 (별도 프로세스에서 재작성)
5. 모듈명은 절대 변경하지 않습니다
6. 선택된 Tool과 기본 Tool이 동일하더라도, 원본 내용에 다른 Tool 이름이 섞여 있으면 선택 Tool로 통일합니다

[Tool별 특성 가이드]

▷ IDE형 AI 코드 어시스턴트
- Cursor: VS Code 기반 에디터, Cmd+K 인라인 편집, Cmd+L 채팅, Composer로 멀티파일 편집, @파일/@심볼 컨텍스트 참조
- Claude Code: CLI/터미널 기반, 자연어로 복잡한 코드베이스 탐색·편집, 셸 명령 직접 실행, git 통합, 파일 전역 grep·edit
- Codex (OpenAI): 코드 생성·자동완성, API 호출 또는 Codex CLI 통해 활용

▷ 노코드 자동화
- Make (구 Integromat): 시각적 시나리오 빌더, 모듈·연결 기반, 1000+ 앱 통합, 라우터·필터·반복 처리, 고급 데이터 변환 내장
- n8n: 오픈소스 워크플로우 자동화, 셀프 호스팅 가능, 노드 기반, Code 노드로 JS/Python 삽입, 자체 호스팅 시 비용 효율
- Zapier: 트리거·액션 기반 단순 자동화, 멀티스텝 Zap, 필터·포맷터, 7000+ 앱 통합, 팀 협업 기능
- Power Automate (Microsoft): M365 통합 자동화, Desktop Flow(RPA)와 Cloud Flow, SharePoint·Teams·Outlook 연동

▷ 에이전트형 웹 앱 빌더
- Lovable: 자연어로 풀스택 웹 앱 생성, React/Vite/Tailwind 기반, Supabase 연동, GitHub 동기화
- v0 (Vercel): UI 컴포넌트·Next.js 앱 생성, shadcn/ui 기반, Vercel 즉시 배포
- Replit: 온라인 IDE + AI Agent, 클라우드 실행, 공유 URL, DB·Auth 내장
- Bolt.new: StackBlitz 기반, 브라우저에서 즉시 웹 앱 생성·실행·배포

▷ 에이전트·LLM 오케스트레이션 프레임워크
- LangChain: LLM 애플리케이션 프레임워크, 체인·에이전트·메모리·RAG 구성, Python/JS
- LangGraph: 그래프 기반 멀티 에이전트 오케스트레이션, StateGraph·노드·엣지, 조건 분기·루프·인간 개입

▷ 대화형 LLM
- Gemini (Google): 멀티모달, 긴 컨텍스트, Google Workspace·Drive 통합, Deep Research
- ChatGPT (OpenAI): GPTs·Custom Instructions, 코드 인터프리터, Canvas, 이미지 생성
- Claude (Anthropic): Projects·Artifacts·MCP, 긴 문서 분석, Computer Use, Skills
- Perplexity: AI 검색, 출처 기반 답변, Deep Research

▷ 디자인·생성형 미디어
- Figma: UI 디자인, 컴포넌트·오토레이아웃·Dev Mode, Make/AI 플러그인
- Nano Banana (Google): 이미지 편집·생성·인페인팅, 자연어로 편집 지시
- Higgsfield: AI 비디오 생성·카메라 컨트롤·모션
- GenSpark: AI 검색·리서치 에이전트, 슈퍼 에이전트로 복합 태스크

▷ 문서·지식 AI
- Notion AI: 문서 내 AI 작성·요약·번역, Notion DB 연동

[작업 방식 — 각 불릿마다 3단계 수행]
1. 원본 불릿에서 다른 Tool 이름·일반적 예시·추상적 표현 식별
2. 선택된 Tool로 동일한 학습 목표를 달성하는 실제 실습·예시·문법으로 교체
3. 자가 점검: 선택 Tool의 실제 기능을 반영했는지, 추상적 일반론에 그치지 않았는지, 원본 불릿 개수를 유지했는지

[좋은 예 — Make로 전환]
원본: "[실습] IDE형 도구로 간단한 웹페이지 제작 (계산기·구구단·날씨 알리미)"
좋음: "[실습] Make 시나리오 구성 — 웹훅 트리거 → Google Sheets 데이터 읽기 → 라우터로 조건 분기 → Slack 메시지 전송, 에러 핸들러로 재시도 로직 추가"

[좋은 예 — LangGraph로 전환]
원본: "- [실습] 간단한 챗봇 구현 (API 연동, Rule 작성)"
좋음: "- [실습] LangGraph StateGraph 기반 챗봇 구현 — 상태 스키마 정의, 분류기 노드·응답 생성 노드 구성, 조건부 엣지로 툴 호출 분기, interrupt_before로 사람 승인 단계 삽입"

[좋은 예 — Cursor로 전환]
원본: "- 핵심 워크플로우: 프롬프트 입력 → 코드 자동 생성 → 실행 승인"
좋음: "- 핵심 워크플로우: Cursor Composer 창 열기(Cmd+I) → 요구사항 자연어 기술·@파일 컨텍스트 참조 → 멀티파일 생성/편집 제안 검토 → Accept/Reject로 승인"

[좋은 예 — n8n으로 전환]
원본: "- [실습] 엑셀 파일 자동 합치기 + 요약 리포트 생성"
좋음: "- [실습] n8n 워크플로우 — Schedule 트리거 → Google Drive 노드로 폴더 내 엑셀 읽기 → Spreadsheet File 노드로 병합 → Code 노드(JS)로 집계 → HTTP Request로 Slack 전송"

[좋은 예 — Claude Code로 전환]
원본: "- [실습] 자연어 지시로 간단한 도구 제작 (구구단·계산기)"
좋음: "- [실습] Claude Code 터미널에서 자연어 지시 — 요구사항 설명·파일 구조 요청 → Claude가 Write/Edit 툴로 파일 생성 → Bash로 실행·테스트 → 자연어로 수정 요청 반복"

[나쁜 예 — Tool 이름만 접두]
나쁨: "Make 코드 자동 생성·Make 웹 앱 배포·Make 디버깅"
좋음: 위의 Make 전환 예시처럼 Make의 실제 구성 요소(시나리오·모듈·라우터·웹훅)로 구체화

[JSON 출력 문법 규칙 — 매우 중요]
응답 전체는 반드시 유효한 JSON 객체 하나여야 합니다. 다음 규칙을 엄격히 지키세요:

1. rewrittenContent 문자열 안에서 인용이나 예시를 표기할 때는 **홑따옴표(')** 또는 **한국어 꺾쇠(「」, ',')** 만 사용하세요.
2. JSON 구조의 키·값 경계를 나타내는 이중 따옴표(")는 JSON 문법에서만 사용하고, 문자열 값 내부에는 절대 쓰지 마세요. 내부에서 이중 따옴표를 쓰면 파싱 실패로 전체 응답이 버려집니다.
3. Markdown 코드 펜스(\`\`\`)로 감싸지 마세요.
4. JSON 외 서문·설명·후기를 출력하지 마세요.

나쁜 예 (이중 따옴표 중첩 → 파싱 실패):
  "rewrittenContent": "목표: "효율 향상"을 위한 자동화"

좋은 예 (홑따옴표):
  "rewrittenContent": "목표: '효율 향상'을 위한 자동화"

좋은 예 (한국어 꺾쇠):
  "rewrittenContent": "목표: 「효율 향상」을 위한 자동화"

[금지 — 최종 체크리스트]
다음 중 하나라도 해당하면 해당 불릿을 재작성하세요:
- 원본에 있던 다른 Tool 이름이 그대로 남은 경우
- 선택 Tool을 명사 앞에 접두만 붙인 경우 ("Make 코드 생성" 같은 형태)
- 선택 Tool로는 실제로 수행 불가능한 실습을 제시한 경우
- "자동화 도구로 XXX하기" 수준의 추상적 표현
- 한국어 외 문자 (일본어 히라가나·가타카나, 간체 한자 등) 혼입
- 모듈명·시수 변경
- 불릿 개수 변경
- rewrittenContent 문자열 내부에 이중 따옴표(") 사용 (홑따옴표 ' 또는 꺾쇠 「」 로 교체)`;

function buildBatchPrompt({ topicCode, topicName, modules }) {
  const moduleBlocks = modules
    .map(
      (m, i) => `---
모듈 ${i + 1}
- ID: ${m.id}
- 이름: ${m.name}
- 시수: ${m.hours}H
- 난이도: ${m.difficulty}
- 선택된 Tool: ${m.selectedTool}${m.defaultTool && m.defaultTool !== m.selectedTool ? `\n- 기본 Tool (원본 작성 기준): ${m.defaultTool}` : ''}
- 원본 학습 내용:
${m.originalContent}`
    )
    .join('\n\n');

  return `[주제]
- 코드: ${topicCode}
- 이름: ${topicName}

[재작성 대상 모듈들] (총 ${modules.length}개)
각 모듈의 원본 학습 내용을 선택된 Tool에 맞춰 재작성하세요.

${moduleBlocks}

[JSON 응답 형식 — 이 스키마 엄격히 준수]
{
  "modules": [
    {
      "id": "모듈 ID",
      "rewrittenContent": "재작성된 학습 내용 (원본 불릿 개수 동일 유지)"
    }
  ]
}

modules 배열에는 입력된 ${modules.length}개 모듈에 대한 재작성 결과가 모두 포함되어야 합니다.
JSON 외 다른 설명·서문·후기를 절대 출력하지 마세요. Markdown 코드 펜스(\`\`\`)로 감싸지 마세요.
rewrittenContent 문자열 내부에 인용·예시를 쓸 때는 반드시 홑따옴표(') 또는 꺾쇠(「」)만 사용하세요. 이중 따옴표(")는 JSON 문법에서만 쓰고 문자열 값 안에는 절대 넣지 마세요.`;
}

// ====================================================================
// 서버사이드 detector (로그용)
// ====================================================================
function detectMultilingualErrors(text) {
  const errors = [];
  const hiragana = text.match(/[\u3040-\u309F]/g);
  if (hiragana) errors.push({ type: 'hiragana', count: hiragana.length });
  const katakana = text.match(/[\u30A0-\u30FF]/g);
  if (katakana) errors.push({ type: 'katakana', count: katakana.length });
  const cjkRuns = text.match(/[\u4E00-\u9FFF]{2,}/g);
  if (cjkRuns) errors.push({ type: 'cjk_run', count: cjkRuns.length });
  return errors;
}

function countBullets(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('-')).length;
}

function runDetectors(rewrittenModules, originalModules) {
  const report = [];
  for (const m of rewrittenModules) {
    const original = originalModules.find((o) => o.id === m.id);
    if (!original) {
      report.push({ id: m.id, issue: 'UNKNOWN_MODULE_ID' });
      continue;
    }
    const originalCount = countBullets(original.originalContent);
    const newCount = countBullets(m.rewrittenContent);
    const allText = m.rewrittenContent ?? '';
    const ml = detectMultilingualErrors(allText);
    const bulletMismatch = newCount !== originalCount;
    if (ml.length || bulletMismatch) {
      report.push({
        id: m.id,
        bulletMismatch: bulletMismatch ? `${originalCount}->${newCount}` : null,
        multilingual: ml.length ? ml : null,
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

// customize-curriculum.js와 동일한 state-machine repair
function repairJsonStrings(text) {
  const out = [];
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      out.push(ch);
      escape = false;
      continue;
    }
    if (ch === '\\') {
      out.push(ch);
      escape = true;
      continue;
    }
    if (ch !== '"') {
      out.push(ch);
      continue;
    }
    if (!inString) {
      inString = true;
      out.push(ch);
      continue;
    }
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

// ====================================================================
// Anthropic 클라이언트 + 버전 식별자
// ====================================================================
const client = new Anthropic();
const APP_VERSION = 'rewrite-by-tool-v1';

// ====================================================================
// 핸들러
// ====================================================================
export default async function handler(req, res) {
  console.log(`[rewrite-by-tool] handler invoked (version=${APP_VERSION})`);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[rewrite-by-tool] ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { topicCode, topicName, modules } = req.body ?? {};

  if (!topicCode || !Array.isArray(modules) || modules.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['topicCode', 'modules (non-empty array with {id, name, hours, difficulty, selectedTool, originalContent})'],
    });
  }

  // customize-curriculum과 동일한 배치 전략: 11개 이하는 단일 호출
  const SINGLE_CALL_THRESHOLD = 11;
  const batches = [];
  if (modules.length <= SINGLE_CALL_THRESHOLD) {
    batches.push(modules);
  } else {
    for (let i = 0; i < modules.length; i += SINGLE_CALL_THRESHOLD) {
      batches.push(modules.slice(i, i + SINGLE_CALL_THRESHOLD));
    }
  }
  console.log(`[rewrite-by-tool] ${modules.length} modules → ${batches.length} batch(es)`);

  const callClaudeForBatch = async (batchModules) => {
    const userPrompt = buildBatchPrompt({ topicCode, topicName, modules: batchModules });
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
        console.error(`[rewrite-by-tool] rate limit on batch ${i + 1}/${batches.length}, retry after ${retryAfter}s`);
        return res.status(429).json({
          error: `요청이 많아 잠시 대기가 필요합니다. ${retryAfter}초 후 다시 시도해주세요.`,
          retryAfter,
          partialProgress: allModules.length,
        });
      }
      if (err instanceof Anthropic.AuthenticationError) {
        console.error('[rewrite-by-tool] authentication error:', err.message);
        return res.status(500).json({ error: 'AI 인증 오류가 발생했습니다. 관리자에게 문의해주세요.' });
      }
      if (err instanceof Anthropic.BadRequestError) {
        console.error(`[rewrite-by-tool] bad request on batch ${i + 1}:`, err.message);
        return res.status(400).json({ error: '요청 형식 오류가 발생했습니다.' });
      }
      if (err instanceof Anthropic.APIError) {
        console.error(`[rewrite-by-tool] API error ${err.status} on batch ${i + 1}:`, err.message);
        return res.status(502).json({ error: 'AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
      }
      console.error(`[rewrite-by-tool] network error on batch ${i + 1}/${batches.length}:`, err);
      return res.status(502).json({ error: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawContent = textBlock?.text;
    if (!rawContent) {
      console.error(`[rewrite-by-tool] empty content on batch ${i + 1}`);
      return res.status(502).json({ error: 'AI가 빈 응답을 반환했습니다. 다시 시도해주세요.' });
    }

    const content = stripCodeFence(rawContent);

    let parsed;
    let wasRepaired = false;
    try {
      const result = parseModelJson(content);
      parsed = result.parsed;
      wasRepaired = result.repaired;
    } catch (e) {
      console.error(`[rewrite-by-tool] JSON parse failed on batch ${i + 1} (repair also failed):`, content);
      return res.status(502).json({ error: 'AI 응답 형식 오류입니다. 다시 시도해주세요.' });
    }
    if (wasRepaired) {
      console.warn(`[rewrite-by-tool] JSON repaired via repairJsonStrings on batch ${i + 1}`);
    }
    if (!Array.isArray(parsed.modules)) {
      console.error(`[rewrite-by-tool] missing modules array on batch ${i + 1}`);
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

  const detectorReport = runDetectors(allModules, modules);
  if (detectorReport.length > 0) {
    console.warn(
      '[rewrite-by-tool] quality issues:',
      JSON.stringify({ topicCode, elapsedMs: elapsed, batches: batches.length, report: detectorReport }, null, 2)
    );
  } else {
    console.log(
      '[rewrite-by-tool] OK:',
      JSON.stringify({
        topicCode,
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
    rewrittenModules: allModules,
    elapsedMs: elapsed,
  });
}
