import { useMemo } from 'react';
import moduleMaster from '../data/moduleMaster.json';
import topicToolMapping from '../data/topicToolMapping.json';

const DIFF_COLOR = {
  '초급': { bg: '#dcfce7', color: '#166534' },
  '중급': { bg: '#dbeafe', color: '#1e40af' },
  '고급': { bg: '#fef3c7', color: '#92400e' },
  '임원': { bg: '#f3e8ff', color: '#6b21a8' },
};

export default function Step2ModuleSelect({
  selectedTopic,
  selectedModules,
  onModuleToggle,
  onBack,
  onNext,
}) {
  const topicInfo = topicToolMapping.find((t) => t.주제코드 === selectedTopic);
  const allModules = moduleMaster.filter((m) => m.주제코드 === selectedTopic);
  const hasMultiTrack = topicInfo?.트랙?.length > 0;

  // Group modules by track
  const grouped = useMemo(() => {
    if (!hasMultiTrack) {
      return [{ 트랙코드: null, 트랙명: null, 모듈: allModules }];
    }
    const groups = {};
    allModules.forEach((m) => {
      const key = m.트랙 === '—' ? '__none__' : m.트랙;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return Object.entries(groups).map(([key, 모듈]) => {
      const trackInfo = topicInfo.트랙.find((t) => t.코드 === key);
      return {
        트랙코드: key === '__none__' ? null : key,
        트랙명: trackInfo ? trackInfo.명 : key,
        기본시수: trackInfo ? trackInfo.기본시수 : null,
        모듈,
      };
    });
  }, [allModules, hasMultiTrack, topicInfo]);

  const totalSelected = selectedModules.reduce((sum, id) => {
    const m = allModules.find((mod) => mod.모듈ID === id);
    return sum + (m ? m.기본시수 : 0);
  }, 0);

  const formatHours = (h) => {
    if (!h && h !== 0) return '';
    return Number.isInteger(h) ? `${h}H` : `${h}H`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>모듈 선택</h2>
          <p style={styles.subtitle}>
            원하는 모듈을 자유롭게 선택하여 커리큘럼을 구성하세요.
          </p>
        </div>
        <div style={styles.totalBadge}>
          선택 시수
          <span style={styles.totalHours}>{formatHours(totalSelected)}</span>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.트랙코드 || 'single'} style={styles.trackSection}>
          {hasMultiTrack && (
            <div style={styles.trackHeader}>
              <span style={styles.trackCode}>{group.트랙코드}</span>
              <span style={styles.trackName}>{group.트랙명}</span>
              {group.기본시수 && (
                <span style={styles.trackHours}>{group.기본시수}H 기준</span>
              )}
            </div>
          )}
          <div style={styles.moduleList}>
            {group.모듈.map((mod) => {
              const isChecked = selectedModules.includes(mod.모듈ID);
              const diffStyle = DIFF_COLOR[mod.난이도] || DIFF_COLOR['중급'];

              return (
                <label
                  key={mod.모듈ID}
                  style={{
                    ...styles.moduleRow,
                    background: isChecked ? '#f0f4ff' : '#fff',
                    borderColor: isChecked ? '#93c5fd' : '#e5e7eb',
                    cursor: 'pointer',
                    opacity: 1,
                  }}
                >
                  <div style={styles.checkboxArea}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onModuleToggle(mod.모듈ID)}
                      style={styles.checkbox}
                    />
                  </div>
                  <div style={styles.moduleInfo}>
                    <div style={styles.moduleTop}>
                      <span style={styles.moduleName}>{mod.모듈명}</span>
                      <div style={styles.moduleTags}>
                        <span
                          style={{
                            ...styles.diffTag,
                            background: diffStyle.bg,
                            color: diffStyle.color,
                          }}
                        >
                          {mod.난이도}
                        </span>
                      </div>
                    </div>
                    <div style={styles.moduleKeywords}>{mod.학습내용키워드}</div>
                  </div>
                  <div style={styles.moduleHours}>{formatHours(mod.기본시수)}</div>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div style={styles.footer}>
        <button style={styles.backBtn} onClick={onBack}>
          이전
        </button>
        <div style={styles.footerRight}>
          <span style={styles.footerTotal}>
            총 {selectedModules.length}개 모듈 · {formatHours(totalSelected)}
          </span>
          <button
            style={{
              ...styles.nextBtn,
              opacity: selectedModules.length > 0 ? 1 : 0.4,
              cursor: selectedModules.length > 0 ? 'pointer' : 'not-allowed',
            }}
            onClick={onNext}
            disabled={selectedModules.length === 0}
          >
            도구 설정으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '8px 0' },
  header: {
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
    lineHeight: 1.6,
  },
  totalBadge: {
    background: '#1f3864',
    color: '#e0e7ff',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  totalHours: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
  },
  trackSection: {
    marginBottom: 24,
  },
  trackHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: '#1f3864',
    borderRadius: '8px 8px 0 0',
  },
  trackCode: {
    background: '#2E75B6',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
  },
  trackName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
  },
  trackHours: {
    color: '#93c5fd',
    fontSize: 12,
    marginLeft: 'auto',
  },
  moduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  moduleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    border: '1px solid',
    borderRadius: 0,
    transition: 'all 0.1s',
  },
  checkboxArea: {
    paddingTop: 3,
    flexShrink: 0,
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
    accentColor: '#1f3864',
  },
  moduleInfo: {
    flex: 1,
    minWidth: 0,
  },
  moduleTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    flex: 1,
    minWidth: 120,
  },
  moduleTags: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  diffTag: {
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 11,
    fontWeight: 600,
  },
  reqTag: {
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 11,
    fontWeight: 600,
  },
  moduleKeywords: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  moduleIdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  moduleId: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  moduleHours: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f3864',
    minWidth: 36,
    textAlign: 'right',
    flexShrink: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  footerTotal: {
    fontSize: 14,
    color: '#1f3864',
    fontWeight: 600,
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
