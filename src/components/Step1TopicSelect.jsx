import topics from '../data/topics.json';
import topicToolMapping from '../data/topicToolMapping.json';

const LEVEL_COLOR = {
  '초급': { bg: '#dcfce7', color: '#166534' },
  '중급': { bg: '#dbeafe', color: '#1e40af' },
  '고급': { bg: '#fef3c7', color: '#92400e' },
  '임원': { bg: '#f3e8ff', color: '#6b21a8' },
  '레벨별': { bg: '#e0f2fe', color: '#0c4a6e' },
};

export default function Step1TopicSelect({ selectedTopic, onSelect, onNext }) {
  const topicInfo = selectedTopic
    ? topicToolMapping.find((t) => t.주제코드 === selectedTopic)
    : null;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>교육 주제 선택</h2>
      <p style={styles.subtitle}>
        11개 AI 교육 주제 중 하나를 선택하세요. 선택한 주제의 모듈과 도구를 구성합니다.
      </p>

      <div style={styles.grid}>
        {topics.map((topic) => {
          const isSelected = selectedTopic === topic.코드;
          const levelStyle = LEVEL_COLOR[topic.난이도] || LEVEL_COLOR['중급'];
          return (
            <button
              key={topic.코드}
              style={{
                ...styles.card,
                borderColor: isSelected ? '#1f3864' : '#e5e7eb',
                background: isSelected ? '#f0f4ff' : '#fff',
                boxShadow: isSelected
                  ? '0 0 0 2px #1f3864'
                  : '0 1px 3px rgba(0,0,0,0.07)',
              }}
              onClick={() => onSelect(topic.코드)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.codeTag}>{topic.코드}</span>
                <span
                  style={{
                    ...styles.levelTag,
                    background: levelStyle.bg,
                    color: levelStyle.color,
                  }}
                >
                  {topic.난이도}
                </span>
              </div>
              <div style={styles.cardTitle}>{topic.명}</div>
              <div style={styles.cardMeta}>
                <span style={styles.metaItem}>기본 시수: {topic.기본시수}</span>
                <span style={styles.metaDivider}>|</span>
                <span style={styles.metaItem}>대상: {topic.대상}</span>
              </div>
              {topic.멀티트랙 && (
                <div style={styles.multiTrackBadge}>다중 트랙 선택 가능</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedTopic && topicInfo && (
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>선택된 주제: {topicInfo.주제명}</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>기본 도구</span>
            <span style={styles.infoValue}>{topicInfo.기본Tool}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>사용 가능 도구</span>
            <span style={styles.infoValue}>{topicInfo.도구목록.join(', ')}</span>
          </div>
          {topicInfo.트랙 && topicInfo.트랙.length > 0 && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>트랙 구성</span>
              <span style={styles.infoValue}>
                {topicInfo.트랙.map((t) => `${t.명}(${t.기본시수}H)`).join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={styles.footer}>
        <button
          style={{
            ...styles.nextBtn,
            opacity: selectedTopic ? 1 : 0.4,
            cursor: selectedTopic ? 'pointer' : 'not-allowed',
          }}
          onClick={onNext}
          disabled={!selectedTopic}
        >
          모듈 선택으로 이동
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '8px 0',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1f3864',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    border: '2px solid',
    borderRadius: 10,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeTag: {
    background: '#1f3864',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  levelTag: {
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaDivider: {
    color: '#d1d5db',
    fontSize: 11,
  },
  multiTrackBadge: {
    display: 'inline-block',
    marginTop: 8,
    background: '#FFF2CC',
    color: '#92400e',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 11,
    fontWeight: 600,
  },
  infoBox: {
    background: '#f0f4ff',
    border: '1px solid #c7d2fe',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1f3864',
    marginBottom: 10,
  },
  infoRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    minWidth: 90,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13,
    color: '#1f3864',
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
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
    transition: 'background 0.15s',
  },
};
