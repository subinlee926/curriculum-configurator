# Curriculum Configurator — Builder Lite + Top 3 비교 스펙

작성일: 2026-05-26
작성자: 수빈 매니저 + Claude (Opus 4.7)
관련 문서: `~/.claude/skills/curriculum-builder/SKILL.md` (커밋 `b7811bb`)

## 구현 상태

| Week | 항목 | 상태 | 완료일 |
|---|---|---|---|
| 1 | #2 모듈별 LD 설명 산문체 | **배포 완료** (Step 6 고객사 맞춤) | 2026-05-26 |
| 2~3 | Builder Lite v1 (4-field + M4 후보 + 합성) | 폐기 — 사용자 피드백으로 v2로 재설계 | 2026-05-26 |
| 2~3 | Builder Lite v2 (5-field + 단일 생성 + 재생성) | **배포 완료** — 새 설계 | 2026-05-26 |
| 2~3 | Builder Lite v2.1 (보안 환경 입력 통합) | **배포 완료** — intake 6-field로 확장 | 2026-05-26 |
| 2~3 | Builder Lite v2.2 (재생성 의견 반영) | **배포 완료** — 방향성 피드백 input | 2026-05-26 |
| 2~3 | Builder Lite v2.3 (첫 사용자 가이드) | **배포 완료** — 환영 모달 + ? 아이콘 | 2026-05-26 |
| 4~5 | #1 시수 두 세트 토글 | 보류 (Lite v2가 시수를 직접 입력받으므로 가치 감소 — 표준 모드에만 적용 검토) |  |
| 6~7 | #3 Factcheck 배치 | 보류 |  |

## Builder Lite v2 — 재설계 (2026-05-26)

### 재설계 배경

v1 (M4 후보 카드 단계 포함)을 사용자 검토 후 다음 3가지 문제가 드러남:

1. **사용자 가시성 부족**: M4 후보 카드만 보여주고 M1~M3는 결과 단계(Step 5)에서 첫 대면. 학습자 흐름의 80%가 카드 선택 시점에 가려져 있음.
2. **실습이 1개로 한정**: M4를 미리 1개 선택하면 실습 모듈이 1개로 고정. 12H·16H 같은 긴 시수에는 실습이 여러 개여야 자연스러움.
3. **시수 미입력**: defaultHours 1·1·2·2 하드코딩(short 6H). 사용자 needs(4H? 8H? 16H?)와 자동 불일치.

근본 원인: **builder의 14단계 로직(M4 역산·후보 선택)을 lite에 그대로 가져온 것이 잘못된 매핑**. builder의 그 단계는 LD가 task research·DNA 분류 같은 사전 작업을 마친 후 메인 task를 선택하는 의사결정 지점인데, lite는 그 사전 작업을 다 생략했으므로 후보 선택 자체가 의미를 잃어버림.

### v2 새 컨셉 — "Direct Generation"

```
[Builder Lite 진입]
    ↓
[5-field intake]
   - 회사명 (선택)
   - 직무 (필수)
   - 활용 툴 (복수)
   - 주제
   - 시수 (프리셋 4·6·8·12·16H + custom 옵션)
   - 수준 (입문/중급/고급)
    ↓ "커리큘럼 생성" — 단일 API 호출 (30~60초)
    ↓
[Step 5] 표준 모드와 동일 UI + 산문 + 작업 컬럼
   - AI가 시수에 맞춰 모듈 개수 자동 결정 (2~8개)
   - 각 모듈: 모듈명·시수·학습내용·LD 설명 산문 동시 생성
   - 시수 합이 입력 시수와 정확히 일치 (불일치 시 경고 배지)
   - 작업: [전체 재생성] [이 모듈만 재생성] 버튼
   - 복사: [표만 복사] [표 + LD 설명 복사]
    ↓
[종료] Step 6 진입 안 함 — Lite 모드는 Step 5에서 완료
```

### v1과 v2의 비교

| 항목 | v1 (폐기) | v2 (배포) |
|---|---|---|
| 입력 단계 | 4-field 폼 + M4 후보 카드 선택 | 5-field 폼 (시수 포함) — 카드 단계 제거 |
| API 개수 | 2개 (candidates + assemble) | 1개 (generate) |
| 모듈 개수 | 고정 4개 (M1~M4) | 시수에 따라 2~8개 동적 |
| 모듈 시수 | 1·1·2·2 하드코딩 | AI가 시수에 맞춰 자동 분배 |
| 실습 개수 | M4 1개 한정 | 시수 따라 여러 개 가능 (8H+) |
| 산문 (LD 설명) | Step 6에서 별도 생성 | generate API가 동시 생성 |
| Step 6 (고객사 맞춤) | 진입 (중복) | 진입 안 함 (intake에 정보 포함) |
| 재생성 | 없음 | 전체 + 모듈별 |

### v2 핵심 파일

- `api/builder-lite-generate.js` — 단일 API. 시수별 모듈 개수 가이드 + learningContent + proseDescription 동시 생성 + 부분 재생성 지원
- `src/components/BuilderLiteIntake.jsx` v2 — 5-field 폼 (시수 프리셋 토글 + custom)
- `src/App.jsx` — handleLiteRegenerateAll, handleLiteRegenerateOne, liteRegenLoading 상태, lite 모드 Step 6 건너뛰기
- `src/components/Step5Result.jsx` — proseDescription 셀 표시, lite 작업 컬럼, 전체 재생성 액션바, 시수 불일치 배지
- 삭제: `api/builder-lite-candidates.js` (M4 후보 단계 폐기), `api/builder-lite-assemble.js` (generate로 통합)

### v2.1 보안 환경 입력 통합 (2026-05-26)

표준 모드의 Step 4 보안 환경 단계가 Lite에는 빠져 있어 도구 충돌 감지가 안 됐던 문제 해결.

**구현**:
- `src/utils/detectSecurityKeywords.js` 신규 — Step4의 부정 패턴 확장(`구글, 노션 불가` → `구글 불가, 노션 불가`) + 키워드 매칭 + 태그 dedup 로직을 util로 분리. Step4와 Lite가 동일 어휘 공유
- `BuilderLiteIntake.jsx` 6-field로 확장 — 보안 환경 textarea 추가(선택 입력), 300ms debounce 후 실시간 키워드 감지, 감지 태그 칩(hover 시 tooltip)
- `api/builder-lite-generate.js` SYSTEM_PROMPT에 보안 제약 반영 섹션 추가 — **사후 경고 X, 사전 반영 O**:
  1. 제외 도구는 모듈에서 언급하지 않음
  2. 대체 도구로 자연 전환 (대체 흔적 노출 X)
  3. 환경 제약(폐쇄망·DLP)을 학습내용에 사실로만 반영
  4. 모듈 조정 안내 따르기
  5. proseDescription에 한 줄 자연 언급
  6. 보안 입력 비어있으면 제약 없이 생성
- `buildSecurityBlock` 함수가 user prompt에 보안 컨텍스트 주입 (자동 감지 태그 상세 + LD 자유 텍스트)
- `App.jsx`: handleLiteAssembled가 intake의 securityText/detectedTags를 standard 상태(securityText·detectedTags)에도 저장 → Step 5의 도구 충돌 비고/태그 노출 자동 작동. 재생성(전체·모듈별) 호출에도 보안 정보 함께 전달
- APP_VERSION: v2→v3 (`v3-builder-lite-generate-with-security`)

**왜 사전 반영인가**: 표준 모드는 모듈을 미리 선택해놓은 상태라 Step 4가 사후 경고로 작동(비고 컬럼). Lite는 AI가 처음부터 생성하니까 보안 제약을 받으면 그에 맞는 도구·시나리오로 처음부터 만들기가 더 자연스러움. 같은 보안 입력이라도 도구 흐름에 따라 활용 시점이 달라지는 인사이트.

### v2.2 재생성 의견 반영 (2026-05-26)

"이대로 다시 재생성"이 아닌 **"이런 방향으로 다시 재생성"** 흐름을 도입.

**왜 필요했나**: 의견 없는 재생성은 LLM 입장에서 "운에 맡기기" — 같은 입력으로 다시 호출해도 어디를 바꿔야 할지 모름. 영업 환경에서 LD가 1차 결과를 보고 "실습이 더 필요하다" 같은 직관을 가지고 있다면, 그걸 그대로 prompt로 흘려보내면 LLM은 그 차원만 변화시켜서 효율적으로 결과를 개선할 수 있음.

**구현**:
- `api/builder-lite-generate.js`: regenerationFeedback 필드 받음. SYSTEM_PROMPT에 [재생성 의견 반영] 섹션 추가 — 예시 5개 (실습 늘리기·심화로·Tool A 활용·Tool B 빼기·사례 중심·M2 보강) + **충돌 시 우선순위 명시**: 보안 제약 > 시수 가이드 > 재생성 의견. 의견이 시수 변경을 요구해도 시수는 고정. `buildFeedbackBlock` 함수가 user prompt에 의견 블록 주입.
- `App.jsx`: handleLiteRegenerateAll(feedback)·handleLiteRegenerateOne(moduleId, feedback) 시그니처 확장. 빈 문자열이면 의견 없이 호출 (기존 동작 유지).
- `Step5Result.jsx`: lite 액션 바를 2단으로 재구성 — 상단(시수 불일치 + 전체 재생성), 하단(점선 separator + 재생성 의견 textarea + hint). [전체 재생성]과 [모듈별 재생성] 모두 동일 textarea 값을 참조. textarea는 재생성 후에도 유지(반복 iteration 가능).
- APP_VERSION: v3→v4 (`v4-builder-lite-generate-with-feedback`)

**우선순위 규칙의 의미**: "실습 시간을 더 늘려주세요"는 시수 변경을 함의할 수 있는데, 시수는 intake에서 확정되었으므로 보존. 대신 "주어진 시수 내에서 실습 비중을 늘림" 같은 해석으로 자연 적용. 보안·시수는 hard constraint, 의견은 soft signal.

### v2.3 첫 사용자 가이드 (2026-05-26)

처음 사용하는 LD가 표준 vs Lite 어디서 시작할지 결정에 도움 필요. 단계별 디테일이 아닌 **두 모드 분기 자체**가 첫 사용자 최대 막힘 포인트.

**의사결정**:
- 가이드 형식: 환영 모달 (첫 진입 1회) + 핵심 필드 ? 아이콘 — 인터랙티브 투어는 영업 속도 방해, 별도 가이드 페이지는 비침입적이지만 놓침
- 커버리지: **두 모드 차이만** — 각 단계 디테일은 placeholder/subtitle로 충분, 가이드 부담 최소화

**구현**:
- `src/components/WelcomeModal.jsx` 신규 — 두 모드 use case 비교 카드, 백드롭 클릭·ESC·X·시작하기 버튼 모두 닫기. localStorage `configurator-onboarded-v1`로 첫 1회만 자동 노출
- `src/components/HelpTip.jsx` 신규 — 재사용 ? 아이콘 + hover/click tooltip, viewport-aware placement (top/bottom/right)
- `App.jsx`: useEffect로 localStorage 체크하여 첫 진입 시 모달 자동 노출. 헤더 우상단에 "가이드 다시 보기" 버튼 추가 — 언제든 재진입 가능
- `BuilderLiteIntake.jsx`: "총 시수 *" 라벨 옆 ? — "시수만 입력하면 AI가 모듈 개수·구성 자동 결정"
- `Step5Result.jsx`: "재생성 의견 (선택)" 라벨 옆 ? — "방향성 신호 + 우선순위(보안>시수>의견)"

**왜 ? 아이콘은 2개뿐인가**: 모든 필드에 달면 시각 노이즈만 늘고 실제로 안 봐요. **표준 SaaS에 없는 새 컨셉**(AI가 모듈 개수 결정, 의견과 제약의 우선순위)에만 한정하는 게 효과적. 회사명·직무·툴·주제처럼 자명한 필드는 placeholder만으로 충분.

**localStorage 키 버전 suffix의 의미**: `-v1`을 붙여둔 덕분에 향후 큰 UI 변경 시(예: v3 출시) 키를 v2로 bump해서 기존 사용자에게도 다시 모달을 노출시킬 수 있음. 영구 dismiss 함정을 피하는 표준 패턴.

### 학습 — 이 재설계가 가르치는 교훈

1. **상위 도구의 컨셉을 그대로 가져오지 말 것**: builder의 "M4 역산"은 사전 작업이 있을 때 의미 있는 추상화. lite처럼 사전 작업을 생략하는 도구에 그대로 가져오면 무의미해짐. 도구의 컨셉은 그 도구의 **사전 가정과 함께** 평가해야 함.
2. **AI에게 시수까지 위임하는 게 자연스러움**: 인간이 모듈 개수·구성을 결정하는 것보다 AI가 시수 보고 결정하는 게 lite의 영업 속도와 어울림. 결정 권한을 어디까지 위임할지가 도구 설계의 핵심.
3. **단일 API 호출의 가치**: 2개 API(candidates+assemble)가 1개로 통합되면서 1) 응답 시간 단축 2) 상태 관리 단순 3) 에러 발생 지점 절반 4) 캐시 효율 향상. **다단계 워크플로우는 LLM에 일임하고, 인간 인터페이스는 최소화**가 lite류 도구의 정수.

### Builder Lite 구현 요약

- 신규 API 2개: `api/builder-lite-candidates.js` (M4 후보 3개 생성), `api/builder-lite-assemble.js` (M1~M4 자동 합성)
- 신규 컴포넌트: `src/components/BuilderLiteIntake.jsx` (4-field 폼 + 후보 카드 선택)
- 진입 분기: Step 1 상단에 "표준 / 새 커리큘럼" 2개 카드. lite 선택 시 BuilderLiteIntake 진입
- 합류: assemble 완료 시 합성 모듈을 moduleMaster 스키마(한글 키)로 변환 → `customModules` map으로 Step 5/6에 주입 → 기존 흐름 그대로 활용 (보안 환경·고객사 맞춤·산문 카피·시수 토글 모두 자동 적용 가능)
- Step 1 mode toggle, Step 5·6 customModules/customTopicMeta props, Step 5 onBackLabel custom, App.jsx mode 상태 + handleLiteAssembled·handleLiteCancel·handleModeSelect 추가
- Builder Lite 모드에서는 StepIndicator 대신 "Builder Lite" 배지 표시 (2·3·4 단계 건너뛰는 흐름이라 step 표시 의미 없음)
- Lite 모드 진입 → 4-field 폼 → 다음 → 후보 3개 카드 → 선택 → 합성 → Step 5 (표준 모드와 동일 화면) → Step 6 (고객사 맞춤)
- 합성 시 intake의 company·role·level이 Step 6 customization 폼에 미리 채워짐 (LD 수정 가능)
- Step 5에서 "이전" 클릭 시 BuilderLiteIntake로 복귀 (intake 값은 유지되지만 candidates는 재호출 필요 — v2 개선 여지)

---

## 0. 배경과 목적

### 0.1 현재 configurator의 구조적 한계

현재 `curriculum-configurator.vercel.app`은 **"표준 → 고객사 맞춤"** 흐름만 지원한다.

| 단계 | 동작 |
|---|---|
| Step 1 | 11개 표준 주제(N1~N11) 중 택 1 |
| Step 2 | 해당 주제의 모듈을 체크/언체크 |
| Step 3 | 모듈별 Tool 선택 → 자동 재작성 |
| Step 4 | 보안 환경 키워드 입력 |
| Step 5 | 최종 커리큘럼 표시 |
| Step 6 | 고객사 맥락 입력 → 맞춤 재작성 |

**한계**: 표준 주제 N1~N11에 없는 신규 주제·툴 조합·비표준 직무를 요청받으면 LD가 도구를 벗어나 빈 문서에서 시작해야 한다. 영업/미팅 현장의 가장 큰 사용 빈도 손실 지점.

### 0.2 curriculum-builder 스킬과의 관계

`curriculum-builder`는 "0 → 신규 표준 커리큘럼" 생성을 본업으로 한다.

| 구분 | curriculum-builder | configurator |
|---|---|---|
| 사용자 | LD가 책상에서 깊게 작업 | 영업·미팅 중 빠르게 |
| 시간 | ~5분 (14단계) | ~1분 (6단계) |
| 산출 | 표준 시트 환원용 .md | 제안서 즉시 활용용 |
| 품질 보증 | Factcheck·DNA·다양성 풀세트 | LLM 단일 합성 |

본 스펙의 핵심 전략: **builder의 결과물 품질 로직을 configurator의 영업 속도 UX에 이식**.

### 0.3 본 문서가 다루는 4개 후보

| # | 항목 | 영향력 | 난이도 | 구현 추정 |
|---|---|---|---|---|
| ★ | **Builder Lite (신규 모드)** | ★★★★★ | 高 | 5~7일 |
| #2 | 모듈별 LD 설명 산문체 | ★★★★★ | 中 | 2~3일 |
| #1 | 시수 두 세트 토글 (short 6h / long 12h) | ★★★★★ | 中 | 3~4일 |
| #3 | Tool Feature Factcheck 배치 | ★★★★ | 高 | 5~7일 |

---

## 1. ★ Builder Lite — 신규 모드 (핵심 제안)

### 1.1 한 줄 정의

> "표준 커리큘럼에 없는 신규 주제·툴 조합도 LD가 4-field 폼 입력만으로 1~2분 안에 커리큘럼 시안을 받을 수 있는 진입 모드."

### 1.2 진입점 UI

Step 1 주제 선택 화면 상단에 2개 카드 분기.

```
┌────────────────────────────────────┐
│  📚 표준 커리큘럼에서 시작          │
│  N1~N11 중 선택 (기존 흐름)        │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│  ✨ 새 커리큘럼 만들기              │
│  표준에 없는 주제·툴 조합도 OK     │
└────────────────────────────────────┘
```

### 1.3 Step A — 4-field 입력 폼 (확정안)

가이드형 4-field 폼. AI chat 없이 폼 입력만으로 완결. 영업 환경 안정성 최우선.

```
회사명     [____________________]    (선택 — "범용" 가능)
직무       [____________________]    (필수)
툴 (복수)  [Figma ×] [Nano Banana ×]
           [+ 툴 추가]               (필수, 최소 1개)
주제       [____________________]    (필수)

         [← 이전]  [다음 →]
```

**검증 규칙** (builder Skill 1 차용):
- 회사/직무 분리 검증 — "디자인센터" 같은 부서명이 직무 필드에 오면 회사로 이동 제안
- 복수 툴 입력 시 "등" 워딩 자동 제거
- 일관성 — 툴과 주제의 정합성 LLM 1차 점검 (예: Figma + "데이터 분석" 조합 시 경고)

### 1.4 Step B — M4 후보 3개 카드 선택

LLM이 4-field 정보로 메인 실습 시나리오 3개를 생성, LD가 직접 선택.

```
[카드 1] (top)
Figma + Nano Banana로 시즌 굿즈 패키지 시안 제작
─────────────────────────────────────
• 학습 목표: 브랜드 톤앤매너에 맞는 AI 이미지를 ...
• 사용 feature: Figma 컴포넌트, Nano Banana 캐릭터 일관성
• 예상 산출물: 굿즈 4종 × 3가지 안 = 12장 시안
        [이 시나리오로 진행]

[카드 2] [카드 3] ...

         [다시 생성] [카드 1로 자동 진행]
```

**예외 처리**:
- LD 무응답·"기본"·"진행해" → 카드 1 자동 fallback (builder 동일 규칙)
- "다시 생성" → temperature 살짝 올려 재시도 (1회 한정)

**생략한 builder 단계 (영업 속도 우선)**:
- Skill 2 (task research·DNA·workflow) — 도메인 추론으로 대체
- Skill 4 scoring rubric (V3·V4·V2 가중합·Killer 필터) — LLM 단순 합성으로 대체
- 다양성 체크 — Lite는 사용자 책임

### 1.5 Step C — M1~M4 자동 합성 + 합류

선택된 M4 task 기반으로 M3·M2·M1를 단일 API 호출로 합성. 결과물은 기존 Step 5 (최종 커리큘럼) 화면과 **동일한 표 형식**으로 표시.

```
[M1 툴 소개]    [M2 When/Why]    [M3 기초 실습]    [M4 메인 실습]
도구 유형       배경 근거         M4 feature 역산   선택된 시나리오
기본 사용 방식  3~5꼭지           ...               ...
기능 개괄       ...
```

합류 후에는 기존 configurator의 모든 후속 기능을 그대로 사용:
- Step 4 보안 환경 (키워드 감지)
- Step 6 고객사 맞춤
- (#2) 모듈별 LD 설명 산문체
- (#1) 시수 두 세트 토글

### 1.6 백엔드 API 설계

새 엔드포인트 2개 + 기존 엔드포인트 1개 확장.

#### `api/builder-lite-candidates.js` (신규)

```typescript
POST /api/builder-lite-candidates
Request:
{
  company: string,    // "범용" 또는 회사명
  role: string,
  tools: string[],    // 1개 이상
  topic: string
}
Response:
{
  candidates: [
    {
      id: "c1",
      title: string,           // M4 시나리오 제목
      goal: string,            // 1줄 학습 목표
      features: string[],      // 사용 feature 3~5개
      deliverable: string      // 예상 산출물 1줄
    },
    // 3개
  ],
  validationWarnings: string[] // 일관성 경고 (있을 때만)
}
```

- LLM: Claude Sonnet 4.6
- 프롬프트 캐싱: 시스템 프롬프트 cache_control
- 처리 시간 목표: 15~25초

#### `api/builder-lite-assemble.js` (신규)

```typescript
POST /api/builder-lite-assemble
Request:
{
  company, role, tools, topic,
  selectedM4: {              // Step B에서 선택된 카드
    title, goal, features, deliverable
  }
}
Response:
{
  modules: [
    {
      level: "M1" | "M2" | "M3" | "M4",
      title: string,
      defaultHours: number,
      learningContent: string[],  // bullet 배열
      proseDescription?: string   // (#2 적용 시) 산문체 5~7줄
    },
    // 4개
  ]
}
```

- 처리 시간 목표: 30~40초

#### `api/customize-curriculum.js` (기존, 확장)

Builder Lite 결과 modules도 동일 입력 스키마로 받도록 변경. 추가 작업 거의 없음 — 이미 modules 배열 받음.

### 1.7 프론트엔드 상태 관리 (App.jsx)

```javascript
const [mode, setMode] = useState('standard'); // 'standard' | 'builder-lite'

// builder-lite 모드 전용 상태
const [liteIntake, setLiteIntake] = useState({
  company: '', role: '', tools: [], topic: ''
});
const [liteCandidates, setLiteCandidates] = useState(null);
const [liteSelectedM4, setLiteSelectedM4] = useState(null);
const [liteModules, setLiteModules] = useState(null);

// 합류 — liteModules가 채워지면 기존 표준 모드의 selectedModules 자리 대체
const effectiveModules = mode === 'builder-lite'
  ? liteModules
  : selectedModulesFromStandardFlow;
```

### 1.8 구현 추정 5~7일

| 작업 | 추정 |
|---|---|
| Step A 4-field 폼 컴포넌트 | 0.5일 |
| `api/builder-lite-candidates.js` + 프롬프트 설계 | 1.5일 |
| Step B 카드 선택 UI | 0.5일 |
| `api/builder-lite-assemble.js` + 프롬프트 설계 | 1.5일 |
| 합류 로직 (mode 분기) + 상태 관리 | 1일 |
| QA·프롬프트 튜닝 | 1~2일 |

### 1.9 리스크와 완화책

| 리스크 | 완화 |
|---|---|
| LLM이 생성한 M4 시나리오가 도메인적으로 어색 | 카드 3개 + "다시 생성" + 카드 1 fallback |
| Lite 결과물 품질이 표준 N1~N11보다 떨어져 LD가 영업에 못 씀 | 결과물에 "AI 자동 생성 시안 — 표준화 전" 라벨 표기. 좋으면 매월 표준 시트에 환원 |
| API 비용 — 호출당 ~$0.15~0.20 추정 | 표준 모드 ~$0.10보다 약간 비싸지만 영업 가치 대비 충분 |
| 일관성 검증이 잘못 발동해 정상 입력을 차단 | 경고만 표시하고 진행은 허용 (hard block X) |

---

## 2. #2 — 모듈별 LD 설명 산문체

### 2.1 한 줄 정의

> "현재 학습내용 bullet만 표시되는 결과물에 모듈당 5~7줄 산문체 설명을 자동 추가하여, LD가 그대로 제안서에 붙여넣을 수 있게 한다."

### 2.2 현재 상태와 문제

현재 Step 5/6 결과:

```
[M1] 툴 소개
- Figma 기본 사용법
- 컴포넌트 개념
- 라이브러리 활용
```

bullet은 강사용 가이드로는 충분하지만, LD가 제안서에 붙일 산문 카피로는 부족. 직접 작성에 모듈당 5~10분 소요.

### 2.3 builder 출처 로직

`skill-curriculum-final/SKILL.md` (Step 14):
> "모듈별 LD 설명 4건(M1·M2·M3·M4 각 5-7줄 산문체)을 작성. 표 본체는 공정 3 산출 그대로 보존(글자 단위), LD 설명만 추가."

`short_equivalent` 모듈은 3 요소 자연 포함:
1. 정직성 표시 (long 모드인데 추가 거리 없어 short과 동일)
2. 확장 어려움 사유
3. 절감 시간 활용 제안

### 2.4 UI 변경

```
[M1] 툴 소개                                     (1h)
─────────────────────────────────────────────────
• Figma 기본 사용법
• 컴포넌트 개념
• 라이브러리 활용

📝 LD 설명
디자이너 실무에서 Figma를 처음 접하는 학습자도
30분 안에 협업 가능한 수준에 도달하도록 설계되었습니다.
컴포넌트와 라이브러리 개념을 먼저 잡아두면 ...
─────────────────────────────────────────────────

         [복사 — 표만]  [복사 — 표+산문]
```

### 2.5 백엔드 변경

`api/customize-curriculum.js` 응답 스키마 확장:

```typescript
modules: [{
  ...기존 필드,
  proseDescription: string  // 5~7줄 산문체
}]
```

프롬프트에 builder의 산문 규칙 추가:
- 모듈당 5~7줄
- 한국어 산문체 (불릿 X)
- [Report Format Preferences](feedback_report_format.md) 정합: 서술형·이모지 최소화·담당자 명시 X

### 2.6 구현 추정 2~3일

- 프롬프트 작성·튜닝: 1일
- UI 컴포넌트 (산문 영역 + 복사 옵션 분리): 0.5일
- QA: 0.5~1.5일

### 2.7 리스크

- 산문 길이가 일정치 않으면 표 정렬 깨질 수 있음 → max length 강제 + 줄바꿈 처리

---

## 3. #1 — 시수 두 세트 토글 (short 6h / long 12h)

### 3.1 한 줄 정의

> "현재 결과물에 시수 차원이 없어 영업 단계의 '몇 시간 과정인가요?' 질문에 즉답 불가. short/long 두 옵션을 토글로 동시에 보여준다."

### 3.2 builder 출처 로직

`skill-hours-blocks/SKILL.md` (Step 12):
- **short**: 합 6h, 모듈별 1·1·2·2h. post-factcheck 본문 그대로 복사 + 시수 라벨
- **long**: 합 12h, 모듈별 2·2·4·4h. **옵션 c 모듈별 차등 합성** — M3·M4 적극 재생성, M2·M1 추가 거리 있으면 합성·없으면 정직 표기 (`module_labels.{mN}: "short_equivalent"`)
- 합성 순서: M4 → M3 → M2 → M1 (역산)

### 3.3 UI 변경

Step 5 최종 커리큘럼 상단에 토글:

```
시수 모드:  [● short 6h]  [○ long 12h]  [○ custom]

[M1] 툴 소개         1h ↔ 2h
[M2] When/Why        1h ↔ 2h
[M3] 기초 실습       2h ↔ 4h
[M4] 메인 실습       2h ↔ 4h
─────────────────────
                     6h ↔ 12h

(long 모드 선택 시 "M2는 short과 동일 — short_equivalent" 같은 정직성 라벨 모듈에 표시)
```

### 3.4 백엔드 변경

`api/rewrite-by-tool.js`와 `api/customize-curriculum.js` 모두에 `hourMode` 파라미터 추가.

```typescript
Request:
{
  ...기존 필드,
  hourMode: 'short' | 'long'  // default 'short' (= 기존 동작)
}

Response:
{
  modules: [{
    ...기존,
    hours: { short: 1, long: 2 },
    longLabel: 'expanded' | 'short_equivalent'
  }]
}
```

- short 모드: 기존 동작 그대로 + hours 필드만 추가
- long 모드: M4·M3 학습내용을 확장 재합성 (LLM 추가 호출 — M4·M3만)
- M2·M1: 학습내용 추가 거리 LLM 1차 판단 → 있으면 합성·없으면 short 복사 + `short_equivalent` 라벨

### 3.5 구현 추정 3~4일

- 백엔드 hourMode 처리 + long 재합성 프롬프트: 2일
- UI 토글 + 시수 표시: 0.5일
- 정직성 라벨 표시 로직: 0.5일
- QA: 1일

### 3.6 리스크

- long 모드는 LLM 호출 2~3회 추가 → 비용 1.5배·시간 +20초
- "추가 거리 없음" 판정이 잘못되면 short_equivalent가 과다 발생 (학습 가치 의심) → 자동 평가 룰 추가 필요

---

## 4. #3 — Tool Feature Factcheck 배치

### 4.1 한 줄 정의

> "moduleMaster.json은 매월 수동 업데이트. Tool feature가 stale되어도 자동 감지 X. 주 1회 cron으로 모든 모듈의 feature 신선도를 자동 진단한다."

### 4.2 현재 상태와 문제

`reference_curriculum_configurator.md`의 "데이터 업데이트 루틴":
> "매월 1회 정기 업데이트 (수빈 님 요청 시 진행). 프로세스: 재분류 시트에 신규 제안서 추가 → Claude Code로 분석 → 표준 커리큘럼 시트 + JSON 업데이트 → git push → Vercel 자동 배포."

문제: 매월까지의 신선도 gap. Tool feature가 빠르게 바뀌는 시점(2026-04-17 Lovable·v0 등 15개 삭제 사건)에 stale 모듈이 영업에 노출될 위험.

### 4.3 builder 출처 로직

`skill-factcheck/SKILL.md` (Step 10):
- Phase 1 산출 m1~m4 모듈에서 등장하는 툴 feature를 현재 시점 기준으로 웹 검증
- 문제 발견 시 대체 feature 선정 → 모듈 재구성 (`.v2.md` 별도 파일, 원본 보존)
- `tool-features.json` SHA-256 pre/post 일치 의무 (Skill 3 불침해)

### 4.4 두 가지 모드

#### 모드 A — 운영자 배치 (추천)

Vercel Cron으로 주 1회 (예: 월요일 03:00) 모든 모듈 factcheck → 결과를 `data/factcheck-stale-modules.json`에 저장 → 운영자 대시보드 `/admin/stale`에 표시.

```
[관리자 대시보드]                  마지막 검수: 2026-05-25 03:00
────────────────────────────────────────────────────────
주의 필요 모듈 3건:

🔸 N1-M3-2 "Cursor 활용 코드 작성"
   stale feature: "Cursor 0.x Composer 모드"
   현재: 1.x로 명칭 변경, UI 변경됨
   제안 대체: "Cursor 1.x Agent 모드"
   [확인 → JSON 업데이트] [기각]

🔸 N6-M4-1 "n8n 워크플로우 ..."
   ...
```

수빈님의 매월 업데이트 루틴을 **주간 자동 trigger**로 전환 — 감지는 자동, 의사결정은 사람.

#### 모드 B — 사용자 실시간

Step 3 Tool 선택 직후 백그라운드로 factcheck 1회 실행 → "이 Tool의 X 기능이 변경되었습니다" 토스트.

- 장점: 가장 신선
- 단점: 매 세션마다 API 호출 (비용 1.3배·지연 +5초)

**권장: 모드 A 우선 구현, 모드 B는 보류**.

### 4.5 백엔드 설계 (모드 A)

```
vercel.json:
{
  "crons": [
    { "path": "/api/cron/factcheck", "schedule": "0 3 * * 1" }
  ]
}

api/cron/factcheck.js:
  for each module in moduleMaster.json:
    for each tool referenced:
      WebSearch(tool + " " + feature) → 신선도 판정
  Write data/factcheck-stale-modules.json
  Send Slack notification to #skillmatch_작업현황
```

[SkillMatch Weekly Routine](reference_skillmatch_weekly_routine.md)과 동일 채널 활용. 무음 실패 대비 동일 진단 패턴 적용.

### 4.6 구현 추정 5~7일

- factcheck 프롬프트 + 평가 룰 설계: 2일
- Vercel Cron 설정 + cron 함수: 1일
- 운영자 대시보드 페이지: 1.5일
- Slack 알림 통합: 0.5일
- QA·로깅: 1~2일

### 4.7 리스크

- LLM 환각으로 잘못된 stale 판정 → 운영자 승인 절차 필수 (자동 JSON 수정 금지)
- 143개 모듈 × 평균 2개 툴 = 286 검증 → 1회 cron당 ~$2~5 API 비용 (월 ~$20)

---

## 5. 우선순위 권장

### 5.1 최종 권장 순서

```
Week 1     : #2 모듈별 LD 설명 산문체    (즉시 가치·Lite와 호환)
Week 2~3   : ★ Builder Lite (3단계 + 합류)  (가장 큰 구조적 가치)
Week 4~5   : #1 시수 두 세트 토글           (Lite 결과물에도 자동 적용)
Week 6~7   : #3 Factcheck 배치 (모드 A)     (월간 루틴 자동화)
```

### 5.2 의존성

```
#2 (산문) ─┬─→ Builder Lite (Lite 결과물에 산문 자동 적용)
           └─→ #1 (시수)       (short_equivalent 산문 처리 위해 #2 선행 권장)
#1 (시수) ────→ Builder Lite (Lite도 시수 토글 가능해야 함)
#3 (factcheck) — 독립 (다른 작업과 무관, 마지막 실행 OK)
```

### 5.3 빠른 실행 가능 슬라이스 (1주 안)

#2만 우선 출시하면:
- API customize-curriculum.js 응답 스키마 확장 1줄
- 프롬프트에 산문 규칙 추가
- UI에 산문 영역 + 복사 버튼 2개

→ 1주일 내 production. LD가 즉시 제안서 작성 시간 절감 체감.

---

## 6. 다음 단계 의사결정 포인트

본 문서는 의사결정 자료. 실제 구현 진입 전 결정 필요한 질문:

1. **순서 확정**: 위 권장 순서대로? 아니면 Builder Lite를 1순위로 당김?
2. **#2 산문 톤**: builder의 5~7줄을 그대로? 아니면 더 짧게(3~4줄)?
3. **#1 시수 라벨링**: `short_equivalent` 영문 라벨 그대로? 한국어 (예: "단축 모드 동일")?
4. **#3 Slack 채널**: `#skillmatch_작업현황` 재활용? 별도 채널 생성?
5. **Builder Lite 결과물 환원**: Lite 결과가 좋으면 매월 표준 시트 환원 — 누가 결정·반영?

---

## 7. 참고

- curriculum-builder SKILL.md 커밋: `b7811bb` (2026-05-26 기준)
- configurator 최신 커밋: `f9232c3 refactor(ui): remove redundant info elements on Step3`
- 관련 메모리:
  - `reference_curriculum_configurator.md` — 36일 전 작성, 본 작업 전 일부 재검증 필요
  - `feedback_configurator_ux.md` — 모듈 자유 선택·ID 숨김·학습내용 상세 표시·부정 맥락 처리
  - `feedback_report_format.md` — 서술형·넘버링·이모지 최소화·담당자 불필요
  - `project_curriculum_update_routine.md` — 매월 1회 정기 업데이트 루틴
