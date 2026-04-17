import { useState, useEffect, useCallback } from 'react';
import securityKeywords from '../data/securityKeywords.json';

const TAG_COLORS = {
  '폐쇄망': { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  '사내LLM전용': { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  '엔터프라이즈API': { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  'M365보유': { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  'M365미보유': { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  'Google환경': { bg: '#e0f2fe', color: '#0c4a6e', border: '#7dd3fc' },
  'DLP적용': { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  '외부SaaS차단': { bg: '#fee2e2', color: '#7f1d1d', border: '#fca5a5' },
  'VDI환경': { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' },
  'ChatGPT차단': { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
  'Copilot전용': { bg: '#dbeafe', color: '#1e3a8a', border: '#93c5fd' },
  '고보안업종': { bg: '#fdf2f8', color: '#701a75', border: '#e879f9' },
  '제한적접속': { bg: '#f0fdf4', color: '#14532d', border: '#86efac' },
};

function highlightText(text, matchedKeywords) {
  if (!matchedKeywords || matchedKeywords.length === 0) return [{ text, highlight: false }];

  const sortedKws = [...matchedKeywords].sort((a, b) => b.키워드.length - a.키워드.length);
  let parts = [{ text, highlight: false, tag: null }];

  sortedKws.forEach((kw) => {
    const newParts = [];
    parts.forEach((part) => {
      if (part.highlight) {
        newParts.push(part);
        return;
      }
      const idx = part.text.toLowerCase().indexOf(kw.키워드.toLowerCase());
      if (idx === -1) {
        newParts.push(part);
        return;
      }
      if (idx > 0) {
        newParts.push({ text: part.text.slice(0, idx), highlight: false });
      }
      newParts.push({
        text: part.text.slice(idx, idx + kw.키워드.length),
        highlight: true,
        tag: kw.태그,
      });
      if (idx + kw.키워드.length < part.text.length) {
        newParts.push({
          text: part.text.slice(idx + kw.키워드.length),
          highlight: false,
        });
      }
    });
    parts = newParts;
  });

  return parts;
}

export default function Step4Security({
  securityText,
  onSecurityTextChange,
  detectedTags,
  onTagsDetected,
  toolSelections,
  selectedModules,
  onBack,
  onNext,
}) {
  const [localText, setLocalText] = useState(securityText);

  const detectKeywords = useCallback((text) => {
    if (!text.trim()) {
      onTagsDetected([], []);
      return;
    }
    const matched = [];
    const seenTags = new Set();
    securityKeywords.forEach((kw) => {
      if (text.toLowerCase().includes(kw.키워드.toLowerCase())) {
        if (!seenTags.has(kw.태그)) {
          seenTags.add(kw.태그);
          matched.push(kw);
        }
      }
    });
    const matchedKws = securityKeywords.filter((kw) =>
      text.toLowerCase().includes(kw.키워드.toLowerCase())
    );
    onTagsDetected(matched, matchedKws);
  }, [onTagsDetected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      detectKeywords(localText);
      onSecurityTextChange(localText);
    }, 300);
    return () => clearTimeout(timer);
  }, [localText, detectKeywords, onSecurityTextChange]);

  // Compute tool warnings
  const toolWarnings = [];
  detectedTags.forEach((tag) => {
    if (tag.효과.제외Tool && tag.효과.제외Tool.length > 0) {
      selectedModules.forEach((moduleId) => {
        const tool = toolSelections[moduleId];
        if (tool && tag.효과.제외Tool.includes(tool)) {
          toolWarnings.push({
            moduleId,
            tool,
            tag: tag.태그,
            alternates: tag.효과.대체Tool,
          });
        }
      });
    }
  });

  const highlightedParts = highlightText(
    localText,
    securityKeywords.filter((kw) =>
      localText.toLowerCase().includes(kw.키워드.toLowerCase())
    )
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>보안 환경 설정</h2>
      <p style={styles.subtitle}>
        고객사 보안 환경, 시스템 제약사항, 허용 도구 등을 자유롭게 입력하세요. 키워드를 자동으로
        감지하여 커리큘럼에 반영합니다.
      </p>

      <div style={styles.inputSection}>
        <label style={styles.inputLabel}>보안 환경 설명</label>
        <div style={styles.textareaWrapper}>
          <textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            placeholder={`예시:\n- 폐쇄망 환경으로 외부 인터넷 접속 불가\n- Microsoft 365 라이선스 보유 (Copilot 미포함)\n- 개인정보 및 DLP 정책 적용\n- ChatGPT 사용 불가, Claude만 허용\n- 금융권으로 보안 규정 강화 적용`}
            style={styles.textarea}
          />
        </div>

        {localText && highlightedParts.some((p) => p.highlight) && (
          <div style={styles.previewBox}>
            <div style={styles.previewLabel}>감지된 키워드 미리보기</div>
            <div style={styles.previewText}>
              {highlightedParts.map((part, i) => {
                if (!part.highlight) return <span key={i}>{part.text}</span>;
                const tagColor = TAG_COLORS[part.tag] || {
                  bg: '#FFF2CC',
                  color: '#92400e',
                  border: '#fde68a',
                };
                return (
                  <mark
                    key={i}
                    style={{
                      background: tagColor.bg,
                      color: tagColor.color,
                      border: `1px solid ${tagColor.border}`,
                      borderRadius: 3,
                      padding: '1px 3px',
                    }}
                  >
                    {part.text}
                  </mark>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {detectedTags.length > 0 && (
        <div style={styles.tagsSection}>
          <h3 style={styles.sectionTitle}>감지된 보안 태그</h3>
          <div style={styles.tagGrid}>
            {detectedTags.map((tag) => {
              const tagColor = TAG_COLORS[tag.태그] || {
                bg: '#f3f4f6',
                color: '#374151',
                border: '#d1d5db',
              };
              return (
                <div
                  key={tag.태그}
                  style={{
                    ...styles.tagCard,
                    borderColor: tagColor.border,
                    background: tagColor.bg,
                  }}
                >
                  <div style={styles.tagHeader}>
                    <span
                      style={{
                        ...styles.tagBadge,
                        background: tagColor.color,
                        color: '#fff',
                      }}
                    >
                      {tag.태그}
                    </span>
                  </div>
                  <p style={{ ...styles.tagDesc, color: tagColor.color }}>{tag.설명}</p>

                  {tag.효과.제외Tool.length > 0 && (
                    <div style={styles.effectRow}>
                      <span style={styles.effectLabel}>제외 도구</span>
                      <div style={styles.toolList}>
                        {tag.효과.제외Tool.map((t) => (
                          <span key={t} style={styles.excludedTool}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {tag.효과.대체Tool.length > 0 && (
                    <div style={styles.effectRow}>
                      <span style={styles.effectLabel}>권장 대체 도구</span>
                      <div style={styles.toolList}>
                        {tag.효과.대체Tool.map((t) => (
                          <span key={t} style={styles.altTool}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {tag.효과.모듈조정 && (
                    <div style={styles.moduleAdjust}>
                      <span style={styles.effectLabel}>모듈 조정 안내</span>
                      <p style={styles.adjustText}>{tag.효과.모듈조정}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toolWarnings.length > 0 && (
        <div style={styles.warningSection}>
          <h3 style={styles.warningTitle}>도구 충돌 경고</h3>
          {toolWarnings.map((w, i) => (
            <div key={i} style={styles.warningCard}>
              <div style={styles.warningIcon}>!</div>
              <div style={styles.warningContent}>
                <span style={styles.warningModuleId}>{w.moduleId}</span>에 선택된{' '}
                <strong>{w.tool}</strong>이(가) 보안 태그{' '}
                <span style={styles.warningTag}>{w.tag}</span>에 의해 제한됩니다.
                {w.alternates.length > 0 && (
                  <span>
                    {' '}
                    권장 대체 도구: <strong>{w.alternates.join(', ')}</strong>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detectedTags.length === 0 && localText.trim() && (
        <div style={styles.noTagBox}>
          입력한 내용에서 특별한 보안 제약 키워드가 감지되지 않았습니다. 커리큘럼은 선택한 도구
          그대로 구성됩니다.
        </div>
      )}

      <div style={styles.footer}>
        <button style={styles.backBtn} onClick={onBack}>
          이전
        </button>
        <button style={styles.nextBtn} onClick={onNext}>
          커리큘럼 확인
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '8px 0' },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1f3864',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.6,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  textareaWrapper: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    minHeight: 140,
    padding: '12px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  previewBox: {
    marginTop: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 7,
    padding: '10px 14px',
    background: '#fafafa',
  },
  previewLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: 600,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#374151',
    whiteSpace: 'pre-wrap',
  },
  tagsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f3864',
    marginBottom: 12,
  },
  tagGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 10,
  },
  tagCard: {
    border: '1.5px solid',
    borderRadius: 9,
    padding: '12px 14px',
  },
  tagHeader: {
    marginBottom: 6,
  },
  tagBadge: {
    display: 'inline-block',
    borderRadius: 5,
    padding: '2px 10px',
    fontSize: 12,
    fontWeight: 700,
  },
  tagDesc: {
    fontSize: 12,
    lineHeight: 1.5,
    margin: '0 0 8px 0',
  },
  effectRow: {
    marginBottom: 6,
  },
  effectLabel: {
    display: 'block',
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 600,
    marginBottom: 3,
  },
  toolList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  excludedTool: {
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    padding: '1px 7px',
    fontSize: 11,
    fontWeight: 600,
  },
  altTool: {
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: 4,
    padding: '1px 7px',
    fontSize: 11,
    fontWeight: 600,
  },
  moduleAdjust: {
    marginTop: 6,
  },
  adjustText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.5,
    margin: 0,
  },
  warningSection: {
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#991b1b',
    marginBottom: 10,
  },
  warningCard: {
    display: 'flex',
    gap: 10,
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  warningIcon: {
    background: '#dc2626',
    color: '#fff',
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  warningContent: {
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 1.6,
  },
  warningModuleId: {
    fontFamily: 'monospace',
    background: '#fecaca',
    borderRadius: 3,
    padding: '1px 4px',
    fontSize: 12,
  },
  warningTag: {
    fontWeight: 700,
    background: '#fecaca',
    borderRadius: 3,
    padding: '1px 4px',
  },
  noTagBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 13,
    color: '#14532d',
    marginBottom: 24,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
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
  nextBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
