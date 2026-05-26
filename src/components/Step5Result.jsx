import { useState } from 'react';
import moduleMaster from '../data/moduleMaster.json';
import topics from '../data/topics.json';
import { getModuleDefaultTool } from '../utils/getDefaultTool';

export default function Step5Result({
  selectedTopic,
  selectedModules,
  toolSelections,
  detectedTags,
  securityText,
  toolRewrittenContent,
  customModules,
  customTopicMeta,
  onBack,
  onBackLabel,
  onNext,
  onReset,
  liteMode = false,
  liteHours,
  onLiteRegenerateAll,
  onLiteRegenerateOne,
  liteRegenLoading,
  liteRegenError,
}) {
  const [copied, setCopied] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');

  const topicMeta = customTopicMeta || topics.find((t) => t.코드 === selectedTopic);

  const curriculumRows = selectedModules.map((moduleId, idx) => {
    const mod = customModules?.[moduleId] || moduleMaster.find((m) => m.모듈ID === moduleId);
    if (!mod) return null;
    const tool = toolSelections[moduleId] || getModuleDefaultTool(moduleId, selectedTopic);

    // Tool 기반 재작성된 내용이 현재 Tool과 일치하면 우선 사용, 아니면 원본
    const rewritten = toolRewrittenContent?.[moduleId];
    const contentText =
      rewritten && rewritten.toolAtRewrite === tool
        ? rewritten.rewrittenContent
        : (mod.학습내용 || mod.학습내용키워드 || '—');

    // Build 비고 based on detected tags
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
      학습내용: contentText,
      proseDescription: mod.proseDescription || null,
      시수: mod.기본시수,
      Tool: tool,
      비고: notes.join(' / ') || '—',
      hasWarning: notes.length > 0,
    };
  }).filter(Boolean);

  const totalHours = curriculumRows.reduce((s, r) => s + r.시수, 0);
  const formatHours = (h) => `${h}H`;

  const warningCount = curriculumRows.filter((r) => r.hasWarning).length;
  const hasProse = curriculumRows.some((r) => r.proseDescription);
  const hoursMismatch = liteMode && typeof liteHours === 'number' && liteHours !== totalHours;

  const buildCopyText = ({ includeProse }) => {
    const header = ['순서', '모듈명', '학습 내용', '시수', 'Tool', '비고'].join('\t');
    const rows = curriculumRows
      .map((r) => {
        let content = r.학습내용;
        if (includeProse && r.proseDescription) {
          content = `${content}\n\n[LD 설명]\n${r.proseDescription}`;
        }
        return [r.순서, r.모듈명, content.replace(/\n/g, ' '), formatHours(r.시수), r.Tool, r.비고].join('\t');
      })
      .join('\n');
    const footer = `\n합계\t${curriculumRows.length}개 모듈\t\t${formatHours(totalHours)}\t\t`;
    return [header, rows, footer].join('\n');
  };

  const handleCopy = ({ includeProse = false } = {}) => {
    const text = buildCopyText({ includeProse });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>맞춤 커리큘럼</h2>
          <p style={styles.subtitle}>구성된 커리큘럼을 확인하고 클립보드로 복사하세요.</p>
        </div>
        <div style={styles.copyBtnGroup}>
          <button
            style={{
              ...styles.copyBtn,
              background: copied ? '#16a34a' : '#2E75B6',
            }}
            onClick={() => handleCopy({ includeProse: false })}
            title="표 영역만 클립보드에 복사"
          >
            {copied ? '복사 완료' : hasProse ? '표만 복사' : '클립보드 복사'}
          </button>
          {hasProse && (
            <button
              style={{
                ...styles.copyBtn,
                background: copied ? '#16a34a' : '#1f3864',
              }}
              onClick={() => handleCopy({ includeProse: true })}
              title="표와 LD 설명 산문을 함께 복사"
            >
              {copied ? '복사 완료' : '표 + LD 설명 복사'}
            </button>
          )}
        </div>
      </div>

      {liteMode && (
        <div style={styles.liteActionBar}>
          <div style={styles.liteActionTop}>
            <div style={styles.liteActionLeft}>
              {hoursMismatch && (
                <span style={styles.hoursMismatchTag}>
                  요청 {liteHours}H / 생성 {totalHours}H — 차이 있음
                </span>
              )}
              {liteRegenError && (
                <span style={styles.liteErrorText}>{liteRegenError}</span>
              )}
            </div>
            <button
              type="button"
              style={{
                ...styles.regenAllBtn,
                opacity: liteRegenLoading?.all || liteRegenLoading?.moduleId ? 0.5 : 1,
                cursor: liteRegenLoading?.all || liteRegenLoading?.moduleId ? 'not-allowed' : 'pointer',
              }}
              onClick={() => onLiteRegenerateAll && onLiteRegenerateAll(regenFeedback)}
              disabled={liteRegenLoading?.all || liteRegenLoading?.moduleId}
            >
              {liteRegenLoading?.all ? '전체 재생성 중… (약 30~60초)' : '전체 재생성'}
            </button>
          </div>
          <div style={styles.feedbackRow}>
            <label style={styles.feedbackLabel}>재생성 의견 (선택)</label>
            <textarea
              value={regenFeedback}
              onChange={(e) => setRegenFeedback(e.target.value)}
              placeholder="예) 실습 비중을 더 늘려주세요 / 사례 중심으로 / Tool A를 더 활용 / M2가 약합니다"
              style={styles.feedbackTextarea}
              disabled={liteRegenLoading?.all || liteRegenLoading?.moduleId}
            />
            <div style={styles.feedbackHint}>
              전체·모듈별 재생성 모두 이 의견을 함께 보냅니다. 비워두면 의견 없이 재생성됩니다. 보안·시수 제약이 의견보다 우선합니다.
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{topicMeta?.코드}</div>
          <div style={styles.summaryLabel}>{topicMeta?.명}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{curriculumRows.length}개</div>
          <div style={styles.summaryLabel}>선택 모듈</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{formatHours(totalHours)}</div>
          <div style={styles.summaryLabel}>총 교육 시수</div>
        </div>
        <div
          style={{
            ...styles.summaryCard,
            background: detectedTags.length > 0 ? '#fef3c7' : '#f0fdf4',
            borderColor: detectedTags.length > 0 ? '#fde68a' : '#bbf7d0',
          }}
        >
          <div style={styles.summaryValue}>{detectedTags.length}개</div>
          <div style={styles.summaryLabel}>보안 태그</div>
        </div>
      </div>

      {warningCount > 0 && (
        <div style={styles.warningBanner}>
          {warningCount}개 모듈에 도구 충돌이 있습니다. 비고 항목을 확인하여 도구를 교체하세요.
        </div>
      )}

      {detectedTags.length > 0 && (
        <div style={styles.tagSummaryRow}>
          <span style={styles.tagSummaryLabel}>적용된 보안 태그:</span>
          {detectedTags.map((tag) => (
            <span key={tag.태그} style={styles.appliedTag}>
              {tag.태그}
            </span>
          ))}
        </div>
      )}

      {/* Curriculum table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={{ ...styles.th, width: 44 }}>순서</th>
              <th style={{ ...styles.th, width: 160 }}>모듈명</th>
              <th style={{ ...styles.th }}>학습 내용</th>
              <th style={{ ...styles.th, width: 56 }}>시수</th>
              <th style={{ ...styles.th, width: 120 }}>Tool</th>
              {liteMode ? (
                <th style={{ ...styles.th, width: 110 }}>작업</th>
              ) : (
                <th style={{ ...styles.th, width: 180 }}>비고</th>
              )}
            </tr>
          </thead>
          <tbody>
            {curriculumRows.map((row) => {
              const isThisRegenerating = liteRegenLoading?.moduleId === row.id;
              const anyLoading = liteRegenLoading?.all || liteRegenLoading?.moduleId;
              return (
                <tr
                  key={row.순서}
                  style={{
                    ...styles.tr,
                    background: row.hasWarning ? '#fff7ed' : row.순서 % 2 === 0 ? '#f9fafb' : '#fff',
                  }}
                >
                  <td style={{ ...styles.td, textAlign: 'center', color: '#9ca3af' }}>{row.순서}</td>
                  <td style={styles.td}>
                    <div style={styles.moduleNameCell}>{row.모듈명}</div>
                  </td>
                  <td style={{ ...styles.td, fontSize: 13, color: '#374151', lineHeight: '1.5' }}>
                    <div style={{ whiteSpace: 'pre-line' }}>{row.학습내용}</div>
                    {row.proseDescription && (
                      <div style={styles.proseBlock}>
                        <div style={styles.proseLabel}>LD 설명</div>
                        <div style={styles.proseText}>{row.proseDescription}</div>
                      </div>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#1f3864' }}>
                    {formatHours(row.시수)}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.toolPill}>{row.Tool}</span>
                  </td>
                  {liteMode ? (
                    <td style={styles.td}>
                      <button
                        type="button"
                        style={{
                          ...styles.regenOneBtn,
                          opacity: anyLoading ? 0.5 : 1,
                          cursor: anyLoading ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => onLiteRegenerateOne && onLiteRegenerateOne(row.id, regenFeedback)}
                        disabled={anyLoading}
                        title="이 모듈만 다시 생성"
                      >
                        {isThisRegenerating ? '생성 중…' : '재생성'}
                      </button>
                    </td>
                  ) : (
                    <td style={{ ...styles.td, fontSize: 12, color: row.hasWarning ? '#c2410c' : '#6b7280' }}>
                      {row.비고}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={styles.tfootRow}>
              <td colSpan={2} style={styles.tfootLabel}>
                합계
              </td>
              <td style={{ ...styles.td, color: '#6b7280', fontSize: 12 }}>
                {curriculumRows.length}개 모듈
              </td>
              <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1f3864' }}>
                {formatHours(totalHours)}
              </td>
              <td colSpan={2} style={{ ...styles.td, color: '#6b7280', fontSize: 12 }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {securityText && (
        <div style={styles.securityNote}>
          <div style={styles.securityNoteTitle}>보안 환경 메모</div>
          <p style={styles.securityNoteText}>{securityText}</p>
        </div>
      )}

      <div style={styles.footer}>
        <button style={styles.backBtn} onClick={onBack}>
          {onBackLabel || '이전 (보안 환경 수정)'}
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={styles.resetBtn} onClick={onReset}>
            새 커리큘럼 구성
          </button>
          {onNext && (
            <button style={styles.nextBtn} onClick={onNext}>
              다음: 고객사 맞춤 →
            </button>
          )}
        </div>
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
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1f3864',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
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
  copyBtnGroup: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  proseBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px dashed #d1d5db',
  },
  proseLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1f3864',
    letterSpacing: '0.4px',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  proseText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.7,
    whiteSpace: 'pre-line',
  },
  liteActionBar: {
    background: '#f0f4ff',
    border: '1px solid #c7d2fe',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  liteActionTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  liteActionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    fontSize: 12,
  },
  feedbackRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    borderTop: '1px dashed #c7d2fe',
    paddingTop: 10,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1f3864',
    letterSpacing: 0.3,
  },
  feedbackTextarea: {
    width: '100%',
    minHeight: 50,
    padding: '8px 12px',
    border: '1px solid #c7d2fe',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
  },
  feedbackHint: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.5,
  },
  hoursMismatchTag: {
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 5,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  liteErrorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: 500,
  },
  regenAllBtn: {
    background: '#fff',
    color: '#1f3864',
    border: '1px solid #1f3864',
    borderRadius: 7,
    padding: '7px 16px',
    fontSize: 13,
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
    whiteSpace: 'nowrap',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 9,
    padding: '12px 16px',
    background: '#fff',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1f3864',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  warningBanner: {
    background: '#fff7ed',
    border: '1px solid #fdba74',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    color: '#9a3412',
    marginBottom: 12,
  },
  tagSummaryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  tagSummaryLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  appliedTag: {
    background: '#1f3864',
    color: '#e0e7ff',
    borderRadius: 5,
    padding: '2px 9px',
    fontSize: 12,
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  thead: {
    background: '#1f3864',
  },
  th: {
    padding: '11px 14px',
    color: '#e0e7ff',
    fontWeight: 600,
    fontSize: 13,
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid #2E75B6',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background 0.1s',
  },
  td: {
    padding: '10px 14px',
    verticalAlign: 'middle',
    color: '#111827',
  },
  moduleNameCell: {
    fontWeight: 500,
  },
  toolPill: {
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 5,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  reqPill: {
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 11,
    fontWeight: 600,
  },
  tfootRow: {
    background: '#f0f4ff',
    borderTop: '2px solid #1f3864',
  },
  tfootLabel: {
    padding: '10px 14px',
    fontWeight: 700,
    color: '#1f3864',
    fontSize: 14,
  },
  securityNote: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16,
  },
  securityNoteTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#6b7280',
    marginBottom: 6,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
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
    background: '#f9fafb',
    color: '#1f3864',
    border: '1px solid #1f3864',
    borderRadius: 8,
    padding: '12px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  nextBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 26px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
