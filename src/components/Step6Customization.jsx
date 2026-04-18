import { useState, useEffect, useRef } from 'react';
import moduleMaster from '../data/moduleMaster.json';
import topics from '../data/topics.json';
import { getModuleDefaultTool } from '../utils/getDefaultTool';

const LEVEL_OPTIONS = ['입문', '중급', '고급'];

export default function Step6Customization({
  selectedTopic,
  selectedModules,
  toolSelections,
  detectedTags,
  customization,
  setCustomization,
  customizedModules,
  setCustomizedModules,
  viewMode,
  setViewMode,
  onBack,
  onReset,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
      return;
    }
    if (!cooldownIntervalRef.current) {
      cooldownIntervalRef.current = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
      }
    };
  }, [cooldown]);

  const topicMeta = topics.find((t) => t.코드 === selectedTopic);

  const baseRows = selectedModules
    .map((moduleId, idx) => {
      const mod = moduleMaster.find((m) => m.모듈ID === moduleId);
      if (!mod) return null;
      const tool = toolSelections[moduleId] || getModuleDefaultTool(moduleId, selectedTopic);

      const notes = [];
      detectedTags.forEach((tag) => {
        if (tag.효과.제외Tool.includes(tool)) {
          const alt = tag.효과.대체Tool.length > 0 ? tag.효과.대체Tool[0] : '—';
          notes.push(`[${tag.태그}] 도구 변경 필요 → ${alt} 권장`);
        }
      });

      return {
        순서: idx + 1,
        id: moduleId,
        모듈명: mod.모듈명,
        originalContent: mod.학습내용 || mod.학습내용키워드 || '—',
        시수: mod.기본시수,
        Tool: tool,
        난이도: mod.난이도,
        비고: notes.join(' / ') || '—',
        hasWarning: notes.length > 0,
      };
    })
    .filter(Boolean);

  const totalHours = baseRows.reduce((s, r) => s + r.시수, 0);
  const formatHours = (h) => `${h}H`;

  const inputsValid =
    customization.company.trim() &&
    customization.role.trim() &&
    customization.level &&
    customization.audience.trim();

  const handleInput = (field) => (e) => {
    setCustomization({ ...customization, [field]: e.target.value });
  };

  const buildRequestModules = () =>
    baseRows.map((r) => ({
      id: r.id,
      name: r.모듈명,
      hours: r.시수,
      difficulty: r.난이도,
      tool: r.Tool,
      originalContent: r.originalContent,
    }));

  const callApi = async (bodyOverride = null) => {
    const body = bodyOverride ?? {
      company: customization.company.trim(),
      role: customization.role.trim(),
      level: customization.level,
      audience: customization.audience.trim(),
      topicCode: selectedTopic,
      topicName: topicMeta?.명 ?? '',
      modules: buildRequestModules(),
    };

    const res = await fetch('/api/customize-curriculum', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let msg = `서버 오류 (${res.status})`;
      let retryAfter = 0;
      try {
        const j = await res.json();
        if (j.error) msg = j.error;
        if (j.retryAfter) retryAfter = j.retryAfter;
      } catch {}
      const err = new Error(msg);
      err.retryAfter = retryAfter;
      throw err;
    }
    return res.json();
  };

  const handleErr = (err) => {
    setError(err.message);
    if (err.retryAfter && err.retryAfter > 0) {
      setCooldown(err.retryAfter);
    }
  };

  const handleGenerate = async () => {
    if (!inputsValid || loading || cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const data = await callApi();
      const map = {};
      for (const m of data.customizedModules) map[m.id] = m;
      setCustomizedModules(map);
      setViewMode('customized');
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateOne = async (moduleId) => {
    if (regeneratingId || cooldown > 0) return;
    setError(null);
    setRegeneratingId(moduleId);
    try {
      const row = baseRows.find((r) => r.id === moduleId);
      if (!row) return;
      const data = await callApi({
        company: customization.company.trim(),
        role: customization.role.trim(),
        level: customization.level,
        audience: customization.audience.trim(),
        topicCode: selectedTopic,
        topicName: topicMeta?.명 ?? '',
        modules: [
          {
            id: row.id,
            name: row.모듈명,
            hours: row.시수,
            difficulty: row.난이도,
            tool: row.Tool,
            originalContent: row.originalContent,
          },
        ],
      });
      const updated = data.customizedModules?.[0];
      if (updated) {
        setCustomizedModules({ ...customizedModules, [moduleId]: updated });
      }
    } catch (err) {
      handleErr(err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRegenerateAll = async () => {
    if (loading || cooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const data = await callApi();
      const map = {};
      for (const m of data.customizedModules) map[m.id] = m;
      setCustomizedModules(map);
    } catch (err) {
      handleErr(err);
    } finally {
      setLoading(false);
    }
  };

  const renderContentCell = (row) => {
    if (viewMode === 'customized' && customizedModules?.[row.id]) {
      const c = customizedModules[row.id];
      return <div style={{ whiteSpace: 'pre-line' }}>{c.customizedContent}</div>;
    }
    return <div style={{ whiteSpace: 'pre-line' }}>{row.originalContent}</div>;
  };

  const handleCopy = () => {
    const header = ['순서', '모듈명', '학습 내용', '시수', 'Tool', '비고'].join('\t');
    const rows = baseRows
      .map((r) => {
        let content = r.originalContent;
        if (viewMode === 'customized' && customizedModules?.[r.id]) {
          content = customizedModules[r.id].customizedContent;
        }
        return [r.순서, r.모듈명, content.replace(/\n/g, ' '), formatHours(r.시수), r.Tool, r.비고].join('\t');
      })
      .join('\n');
    const footer = `\n합계\t${baseRows.length}개 모듈\t\t${formatHours(totalHours)}\t\t`;
    const text = [header, rows, footer].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasCustomized = customizedModules && Object.keys(customizedModules).length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>고객사 맞춤 커리큘럼</h2>
          <p style={styles.subtitle}>
            고객사와 교육 대상 정보를 입력하면 학습 내용과 실습 주제가 해당 맥락으로 재작성됩니다.
          </p>
        </div>
        {hasCustomized && (
          <button
            style={{ ...styles.copyBtn, background: copied ? '#16a34a' : '#2E75B6' }}
            onClick={handleCopy}
          >
            {copied ? '복사 완료' : '클립보드 복사'}
          </button>
        )}
      </div>

      {/* 입력 폼 */}
      <div style={styles.formCard}>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>고객사명</label>
            <input
              type="text"
              value={customization.company}
              onChange={handleInput('company')}
              placeholder="예: 크래프톤"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>직무명</label>
            <input
              type="text"
              value={customization.role}
              onChange={handleInput('role')}
              placeholder="예: 게임 기획자"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>난이도</label>
            <select
              value={customization.level}
              onChange={handleInput('level')}
              style={styles.input}
              disabled={loading}
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>교육 대상</label>
            <input
              type="text"
              value={customization.audience}
              onChange={handleInput('audience')}
              placeholder="예: 기획 경력 3~5년, AI 경험 적음"
              style={styles.input}
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.formActions}>
          <button
            onClick={handleGenerate}
            disabled={!inputsValid || loading || cooldown > 0}
            style={{
              ...styles.generateBtn,
              opacity: !inputsValid || loading || cooldown > 0 ? 0.5 : 1,
              cursor: !inputsValid || loading || cooldown > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? '맞춤 커리큘럼 생성 중…'
              : cooldown > 0
                ? cooldown >= 120
                  ? `${Math.ceil(cooldown / 60)}분 후 재시도 가능`
                  : `${cooldown}초 후 재시도 가능`
                : hasCustomized
                  ? '맞춤 커리큘럼 재생성'
                  : '맞춤 커리큘럼 생성'}
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}
      </div>

      {/* 결과 영역 */}
      {hasCustomized && (
        <>
          <div style={styles.toggleRow}>
            <div style={styles.toggleGroup}>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(viewMode === 'original' ? styles.toggleBtnActive : {}),
                }}
                onClick={() => setViewMode('original')}
              >
                원본
              </button>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(viewMode === 'customized' ? styles.toggleBtnActive : {}),
                }}
                onClick={() => setViewMode('customized')}
              >
                맞춤
              </button>
            </div>
            <button
              style={{
                ...styles.regenAllBtn,
                opacity: loading || cooldown > 0 ? 0.5 : 1,
                cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={handleRegenerateAll}
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0
                ? cooldown >= 120
                  ? `${Math.ceil(cooldown / 60)}분 대기`
                  : `${cooldown}초 대기`
                : '전체 재생성'}
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={{ ...styles.th, width: 44 }}>순서</th>
                  <th style={{ ...styles.th, width: 160 }}>모듈명</th>
                  <th style={styles.th}>학습 내용</th>
                  <th style={{ ...styles.th, width: 56 }}>시수</th>
                  <th style={{ ...styles.th, width: 120 }}>Tool</th>
                  <th style={{ ...styles.th, width: 100 }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {baseRows.map((row) => (
                  <tr
                    key={row.순서}
                    style={{
                      ...styles.tr,
                      background: row.순서 % 2 === 0 ? '#f9fafb' : '#fff',
                    }}
                  >
                    <td style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>{row.순서}</td>
                    <td style={styles.td}>
                      <div style={styles.moduleNameCell}>{row.모듈명}</div>
                    </td>
                    <td style={{ ...styles.td, fontSize: 13, color: '#374151', lineHeight: '1.5' }}>
                      {renderContentCell(row)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#1f3864' }}>
                      {formatHours(row.시수)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.toolPill}>{row.Tool}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.regenOneBtn,
                          opacity: regeneratingId === row.id || cooldown > 0 ? 0.5 : 1,
                          cursor: regeneratingId === row.id || cooldown > 0 || loading ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => handleRegenerateOne(row.id)}
                        disabled={regeneratingId === row.id || loading || cooldown > 0}
                        title="이 모듈만 다시 생성"
                      >
                        {regeneratingId === row.id
                          ? '생성 중…'
                          : cooldown > 0
                            ? cooldown >= 120
                              ? `${Math.ceil(cooldown / 60)}m`
                              : `${cooldown}s`
                            : '재생성'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={styles.tfootRow}>
                  <td colSpan={2} style={styles.tfootLabel}>
                    합계
                  </td>
                  <td style={{ ...styles.td, color: '#6b7280', fontSize: 12 }}>{baseRows.length}개 모듈</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1f3864' }}>
                    {formatHours(totalHours)}
                  </td>
                  <td colSpan={2} style={{ ...styles.td, color: '#6b7280', fontSize: 12 }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <div style={styles.footer}>
        <button style={styles.backBtn} onClick={onBack}>
          이전 (커리큘럼 확인)
        </button>
        <button style={styles.resetBtn} onClick={onReset}>
          새 커리큘럼 구성
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '8px 0' },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#1f3864', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  copyBtn: {
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  formCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '20px 22px',
    marginBottom: 18,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14,
    marginBottom: 14,
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
  formActions: { display: 'flex', gap: 10, alignItems: 'center' },
  generateBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 24px',
    fontSize: 14,
    fontWeight: 600,
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
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleGroup: {
    display: 'inline-flex',
    background: '#f3f4f6',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    background: 'transparent',
    color: '#6b7280',
    border: 'none',
    borderRadius: 6,
    padding: '7px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleBtnActive: { background: '#fff', color: '#1f3864', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  regenAllBtn: {
    background: '#fff',
    color: '#1f3864',
    border: '1px solid #1f3864',
    borderRadius: 7,
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    marginBottom: 16,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead: { background: '#1f3864' },
  th: {
    padding: '11px 14px',
    color: '#e0e7ff',
    fontWeight: 600,
    fontSize: 13,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #2E75B6',
  },
  tr: { borderBottom: '1px solid #e5e7eb', transition: 'background 0.1s' },
  td: { padding: '10px 14px', verticalAlign: 'middle', color: '#111827' },
  moduleNameCell: { fontWeight: 500 },
  toolPill: {
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 5,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  regenOneBtn: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 5,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tfootRow: { background: '#f0f4ff', borderTop: '2px solid #1f3864' },
  tfootLabel: { padding: '10px 14px', fontWeight: 700, color: '#1f3864', fontSize: 14 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: 10,
  },
  backBtn: {
    background: '#f9fafb',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
  },
  resetBtn: {
    background: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
