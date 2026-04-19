import { useState } from 'react';
import moduleMaster from '../data/moduleMaster.json';
import topics from '../data/topics.json';
import topicToolMapping from '../data/topicToolMapping.json';
import moduleToolMapping from '../data/moduleToolMapping.json';
import { getModuleDefaultTool, getTopicDefaultTool } from '../utils/getDefaultTool';

export default function Step3ToolSelect({
  selectedTopic,
  selectedModules,
  toolSelections,
  onToolChange,
  toolRewrittenContent,
  setToolRewrittenContent,
  onBack,
  onNext,
}) {
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState(null);

  const topicInfo = topicToolMapping.find((t) => t.주제코드 === selectedTopic);
  const availableTools = topicInfo ? topicInfo.도구목록 : [];
  const topicDefaultTool = getTopicDefaultTool(selectedTopic);
  const topicMeta = topics.find((t) => t.코드 === selectedTopic);

  const getModuleInfo = (moduleId) =>
    moduleMaster.find((m) => m.모듈ID === moduleId);

  const getChanges = (moduleId, tool) => {
    const mapping = moduleToolMapping.find(
      (m) => m.모듈ID === moduleId && m.대체Tool === tool
    );
    return mapping ? mapping.변경점 : null;
  };

  const hasAlternatives = (moduleId) => {
    return moduleToolMapping.some((m) => m.모듈ID === moduleId);
  };

  const handleNext = async () => {
    if (rewriting) return;
    setRewriteError(null);

    // 재작성 대상 = toolRewrittenContent에 아직 없는 모든 선택 모듈 (결정 3-b)
    const targets = selectedModules
      .map((moduleId) => {
        const mod = moduleMaster.find((m) => m.모듈ID === moduleId);
        if (!mod) return null;
        const selectedTool = toolSelections[moduleId] || getModuleDefaultTool(moduleId, selectedTopic);
        // 이미 동일 Tool 기준으로 재작성 완료된 모듈은 스킵
        if (toolRewrittenContent[moduleId]?.toolAtRewrite === selectedTool) {
          return null;
        }
        return {
          id: mod.모듈ID,
          name: mod.모듈명,
          hours: mod.기본시수,
          difficulty: mod.난이도,
          selectedTool,
          defaultTool: getModuleDefaultTool(moduleId, selectedTopic),
          originalContent: mod.학습내용 || mod.학습내용키워드 || '—',
        };
      })
      .filter(Boolean);

    // 모두 이미 재작성되어 있으면 즉시 다음 단계로
    if (targets.length === 0) {
      onNext();
      return;
    }

    setRewriting(true);
    try {
      const res = await fetch('/api/rewrite-by-tool', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topicCode: selectedTopic,
          topicName: topicMeta?.명 ?? '',
          modules: targets,
        }),
      });

      if (!res.ok) {
        let msg = `서버 오류 (${res.status})`;
        try {
          const j = await res.json();
          if (j.error) msg = j.error;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      if (!Array.isArray(data.rewrittenModules)) {
        throw new Error('AI 응답 구조 오류입니다.');
      }

      // selectedTool을 함께 보관하여 stale 판정에 활용
      const updates = {};
      for (const rm of data.rewrittenModules) {
        const target = targets.find((t) => t.id === rm.id);
        if (!target) continue;
        updates[rm.id] = {
          rewrittenContent: rm.rewrittenContent,
          toolAtRewrite: target.selectedTool,
        };
      }
      setToolRewrittenContent((prev) => ({ ...prev, ...updates }));
      onNext();
    } catch (err) {
      setRewriteError(err.message || '재작성 중 오류가 발생했습니다.');
    } finally {
      setRewriting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>도구 설정</h2>
      <p style={styles.subtitle}>
        선택한 모듈별로 사용할 AI 도구를 지정합니다. 다음 단계로 넘어갈 때 학습 내용이 선택한 도구에 맞춰 자동 재작성됩니다.
      </p>

      <div style={styles.toolInfoBox}>
        <span style={styles.toolInfoLabel}>이 주제의 기본 도구:</span>
        <span style={styles.defaultToolBadge}>{topicDefaultTool}</span>
        <span style={styles.toolInfoMeta}>
          모듈별 학습내용에 맞춰 기본 도구가 자동 지정됩니다. 필요 시 변경 가능합니다.
        </span>
      </div>

      <div style={styles.moduleList}>
        {selectedModules.map((moduleId) => {
          const mod = getModuleInfo(moduleId);
          if (!mod) return null;
          const moduleDefaultTool = getModuleDefaultTool(moduleId, selectedTopic);
          const currentTool = toolSelections[moduleId] || moduleDefaultTool;
          const changes = currentTool !== moduleDefaultTool ? getChanges(moduleId, currentTool) : null;
          const hasAlt = hasAlternatives(moduleId);

          return (
            <div key={moduleId} style={styles.moduleCard}>
              <div style={styles.cardTop}>
                <div style={styles.cardLeft}>
                  <div style={styles.moduleIdTag}>{mod.모듈ID}</div>
                  <div style={styles.moduleName}>{mod.모듈명}</div>
                  <div style={styles.moduleKeywords}>{mod.학습내용키워드}</div>
                </div>
                <div style={styles.cardRight}>
                  <label style={styles.selectLabel}>사용 도구</label>
                  <select
                    value={currentTool}
                    onChange={(e) => onToolChange(moduleId, e.target.value)}
                    style={styles.select}
                  >
                    {availableTools.map((tool) => (
                      <option key={tool} value={tool}>
                        {tool}
                        {tool === moduleDefaultTool ? ' (기본)' : ''}
                      </option>
                    ))}
                  </select>
                  {!hasAlt && (
                    <div style={styles.noAltNote}>사전 정의된 대체 규칙 없음 (AI 재작성으로 통일)</div>
                  )}
                </div>
              </div>

              {changes && (
                <div style={styles.changesBox}>
                  <span style={styles.changesLabel}>도구 변경 시 내용 변경사항</span>
                  <p style={styles.changesText}>{changes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rewriteError && (
        <div style={styles.errorBanner}>{rewriteError}</div>
      )}

      <div style={styles.footer}>
        <button style={styles.backBtn} onClick={onBack} disabled={rewriting}>
          이전
        </button>
        <button
          style={{
            ...styles.nextBtn,
            opacity: rewriting ? 0.6 : 1,
            cursor: rewriting ? 'not-allowed' : 'pointer',
          }}
          onClick={handleNext}
          disabled={rewriting}
        >
          {rewriting ? 'AI가 도구별 내용 재작성 중…' : '보안 환경 설정으로 이동'}
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
    marginBottom: 16,
  },
  toolInfoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f0f4ff',
    border: '1px solid #c7d2fe',
    borderRadius: 8,
    padding: '10px 16px',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  toolInfoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  defaultToolBadge: {
    background: '#1f3864',
    color: '#fff',
    borderRadius: 5,
    padding: '2px 10px',
    fontSize: 13,
    fontWeight: 700,
  },
  toolInfoMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  moduleCard: {
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '14px 16px',
    background: '#fff',
  },
  cardTop: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cardLeft: {
    flex: 1,
    minWidth: 200,
  },
  cardRight: {
    minWidth: 200,
    flexShrink: 0,
  },
  moduleIdTag: {
    display: 'inline-block',
    background: '#e0e7ff',
    color: '#3730a3',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  moduleKeywords: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  selectLabel: {
    display: 'block',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
    fontWeight: 600,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 7,
    fontSize: 14,
    color: '#111827',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  noAltNote: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 5,
  },
  changesBox: {
    marginTop: 12,
    background: '#FFF2CC',
    border: '1px solid #fde68a',
    borderRadius: 7,
    padding: '10px 14px',
  },
  changesLabel: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: 700,
    display: 'block',
    marginBottom: 4,
  },
  changesText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 1.6,
    margin: 0,
  },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 7,
    padding: '10px 14px',
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 12,
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
