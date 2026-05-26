import { useState } from 'react';

const LEVEL_OPTIONS = ['입문', '중급', '고급'];
const TIER_LABEL = {
  top: '정통 시나리오',
  variant: '도구 활용 폭 확장',
  stretch: '도전적·자동화 중심',
};
const TIER_COLOR = {
  top: { bg: '#dcfce7', color: '#166534' },
  variant: { bg: '#dbeafe', color: '#1e40af' },
  stretch: { bg: '#fef3c7', color: '#92400e' },
};

export default function BuilderLiteIntake({ initial, onAssembled, onCancel }) {
  const [liteStep, setLiteStep] = useState(1);
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    toolsText: initial?.toolsText ?? '',
    topic: initial?.topic ?? '',
    level: initial?.level ?? '중급',
  });
  const [candidates, setCandidates] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingAssemble, setLoadingAssemble] = useState(false);
  const [error, setError] = useState(null);

  const parsedTools = form.toolsText
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const intakeValid =
    form.role.trim().length > 0 && parsedTools.length > 0 && form.topic.trim().length > 0;

  const handleField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleNext = async () => {
    if (!intakeValid || loadingCandidates) return;
    setError(null);
    setLoadingCandidates(true);
    try {
      const res = await fetch('/api/builder-lite-candidates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: form.company.trim() || '범용',
          role: form.role.trim(),
          tools: parsedTools,
          topic: form.topic.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `서버 오류 (${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('AI가 후보를 생성하지 못했습니다. 다시 시도해주세요.');
      }
      setCandidates(data.candidates);
      setSelectedCandidateId(data.candidates[0]?.id || null);
      setLiteStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleRegenerateCandidates = async () => {
    setCandidates(null);
    setSelectedCandidateId(null);
    await handleNext();
  };

  const handleAssemble = async () => {
    if (!selectedCandidateId || loadingAssemble) return;
    const selected = candidates.find((c) => c.id === selectedCandidateId);
    if (!selected) return;
    setError(null);
    setLoadingAssemble(true);
    try {
      const res = await fetch('/api/builder-lite-assemble', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: form.company.trim() || '범용',
          role: form.role.trim(),
          tools: parsedTools,
          topic: form.topic.trim(),
          level: form.level,
          selectedM4: selected,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `서버 오류 (${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data.modules) || data.modules.length !== 4) {
        throw new Error('AI가 모듈 4개를 모두 생성하지 못했습니다. 다시 시도해주세요.');
      }
      onAssembled({
        intake: {
          company: form.company.trim(),
          role: form.role.trim(),
          tools: parsedTools,
          toolsText: form.toolsText,
          topic: form.topic.trim(),
          level: form.level,
        },
        candidates,
        selectedM4: selected,
        modules: data.modules,
        topicName: data.topicName || form.topic.trim(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAssemble(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>새 커리큘럼 만들기</h2>
          <p style={styles.subtitle}>
            {liteStep === 1 && '회사·직무·툴·주제 4가지만 입력하면 AI가 메인 실습 후보 3개를 제시합니다.'}
            {liteStep === 2 && '하나를 선택하면 그 시나리오를 향한 M1~M4 4개 모듈을 자동 설계합니다.'}
          </p>
        </div>
        <button type="button" style={styles.cancelBtn} onClick={onCancel}>
          ← 표준 커리큘럼으로
        </button>
      </div>

      {/* Step 1 — 4-field form */}
      {liteStep === 1 && (
        <div style={styles.formCard}>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>회사명 (선택)</label>
              <input
                type="text"
                value={form.company}
                onChange={handleField('company')}
                placeholder="예: LG생활건강  /  비워두면 '범용'"
                style={styles.input}
                disabled={loadingCandidates}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>직무 *</label>
              <input
                type="text"
                value={form.role}
                onChange={handleField('role')}
                placeholder="예: 디자이너 / 게임 기획자 / 브랜드 마케터"
                style={styles.input}
                disabled={loadingCandidates}
              />
            </div>
            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label}>활용 툴 * (복수면 쉼표로 구분)</label>
              <input
                type="text"
                value={form.toolsText}
                onChange={handleField('toolsText')}
                placeholder="예: Figma, Nano Banana"
                style={styles.input}
                disabled={loadingCandidates}
              />
              {parsedTools.length > 0 && (
                <div style={styles.chipRow}>
                  {parsedTools.map((t) => (
                    <span key={t} style={styles.chip}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ ...styles.field, gridColumn: '1 / span 2' }}>
              <label style={styles.label}>주제 *</label>
              <input
                type="text"
                value={form.topic}
                onChange={handleField('topic')}
                placeholder="예: 브랜드 굿즈 디자인 / 라이브 게임 기획 / 캠페인 자동화"
                style={styles.input}
                disabled={loadingCandidates}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>수준</label>
              <select
                value={form.level}
                onChange={handleField('level')}
                style={styles.input}
                disabled={loadingCandidates}
              >
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={handleNext}
              disabled={!intakeValid || loadingCandidates}
              style={{
                ...styles.primaryBtn,
                opacity: !intakeValid || loadingCandidates ? 0.5 : 1,
                cursor: !intakeValid || loadingCandidates ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingCandidates ? '후보 생성 중… (약 15~25초)' : 'M4 후보 받기 →'}
            </button>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}
        </div>
      )}

      {/* Step 2 — Candidate selection */}
      {liteStep === 2 && candidates && (
        <>
          <div style={styles.intakeRecap}>
            <span style={styles.intakeRecapLabel}>입력</span>
            <span style={styles.intakeRecapValue}>
              {form.company.trim() || '범용'} / {form.role.trim()} / {parsedTools.join(' · ')} / {form.topic.trim()}
            </span>
            <button type="button" style={styles.editLink} onClick={() => setLiteStep(1)}>
              수정
            </button>
          </div>

          <div style={styles.candidateGrid}>
            {candidates.map((c) => {
              const isSelected = c.id === selectedCandidateId;
              const tierStyle = TIER_COLOR[c.tier] || TIER_COLOR.top;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(c.id)}
                  style={{
                    ...styles.candidateCard,
                    borderColor: isSelected ? '#1f3864' : '#e5e7eb',
                    boxShadow: isSelected ? '0 0 0 2px #1f3864' : '0 1px 3px rgba(0,0,0,0.07)',
                    background: isSelected ? '#f0f4ff' : '#fff',
                  }}
                >
                  <div style={styles.candidateHeader}>
                    <span
                      style={{
                        ...styles.tierTag,
                        background: tierStyle.bg,
                        color: tierStyle.color,
                      }}
                    >
                      {TIER_LABEL[c.tier] || c.tier}
                    </span>
                    {isSelected && <span style={styles.selectedMark}>선택됨</span>}
                  </div>
                  <div style={styles.candidateTitle}>{c.title}</div>
                  <div style={styles.candidateGoal}>{c.goal}</div>
                  <div style={styles.candidateMeta}>
                    <div style={styles.metaLabel}>사용 feature</div>
                    <div style={styles.metaValue}>
                      {(c.features || []).map((f, i) => (
                        <span key={i} style={styles.featureChip}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.candidateMeta}>
                    <div style={styles.metaLabel}>예상 산출물</div>
                    <div style={styles.metaValueText}>{c.deliverable}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.candidateActions}>
            <button
              type="button"
              onClick={handleRegenerateCandidates}
              disabled={loadingCandidates || loadingAssemble}
              style={{
                ...styles.secondaryBtn,
                opacity: loadingCandidates || loadingAssemble ? 0.5 : 1,
              }}
            >
              {loadingCandidates ? '재생성 중…' : '후보 3개 다시 생성'}
            </button>
            <button
              type="button"
              onClick={handleAssemble}
              disabled={!selectedCandidateId || loadingAssemble}
              style={{
                ...styles.primaryBtn,
                opacity: !selectedCandidateId || loadingAssemble ? 0.5 : 1,
                cursor: !selectedCandidateId || loadingAssemble ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingAssemble ? 'M1~M4 자동 설계 중… (약 30~40초)' : '이 시나리오로 M1~M4 설계 →'}
            </button>
          </div>

          {error && <div style={styles.errorBanner}>{error}</div>}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '8px 0' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#1f3864', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  cancelBtn: {
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
  formCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '20px 22px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14,
    marginBottom: 16,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: {
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
    fontFamily: 'inherit',
  },
  chipRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  formActions: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' },
  primaryBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 22px',
    fontSize: 14,
    fontWeight: 600,
  },
  secondaryBtn: {
    background: '#fff',
    color: '#1f3864',
    border: '1px solid #1f3864',
    borderRadius: 8,
    padding: '11px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBanner: {
    marginTop: 12,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '9px 13px',
    fontSize: 13,
    color: '#991b1b',
  },
  intakeRecap: {
    background: '#f0f4ff',
    border: '1px solid #c7d2fe',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  intakeRecapLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1f3864',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  intakeRecapValue: { fontSize: 13, color: '#1f3864', flex: 1 },
  editLink: {
    background: 'transparent',
    color: '#2E75B6',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  candidateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
    marginBottom: 16,
  },
  candidateCard: {
    border: '2px solid',
    borderRadius: 10,
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  candidateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierTag: {
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  selectedMark: {
    background: '#1f3864',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
  },
  candidateTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.4,
  },
  candidateGoal: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.55,
  },
  candidateMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metaValue: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaValueText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.55,
  },
  featureChip: {
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontWeight: 500,
  },
  candidateActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
};
