import { useEffect } from 'react';

export default function WelcomeModal({ onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 백드롭 클릭 시 닫기 (모달 내부 클릭은 stopPropagation)
  const handleBackdropClick = () => onClose();
  const handleCardClick = (e) => e.stopPropagation();

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.modal} onClick={handleCardClick} role="dialog" aria-modal="true">
        <button
          type="button"
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <h2 style={styles.title}>AI 커리큘럼 설정기에 오신 것을 환영해요</h2>
        <p style={styles.subtitle}>
          어떤 흐름으로 시작할지 한 번만 안내해드릴게요. 언제든 헤더의{' '}
          <strong style={styles.inlineEmph}>가이드 다시 보기</strong>로 다시 열 수 있어요.
        </p>

        <div style={styles.modeRow}>
          <div style={{ ...styles.modeCard, ...styles.modeCardStandard }}>
            <div style={styles.modeTagStandard}>표준 커리큘럼</div>
            <div style={styles.modeBody}>
              <p style={styles.modeBlurb}>
                팀이 검증한 <strong>11개 AI 교육 주제</strong> 안에서 모듈을 직접 선택하여 구성합니다.
              </p>
              <ul style={styles.modePoints}>
                <li style={styles.modePoint}>약 <strong>1분</strong> 소요 (Step 1~6)</li>
                <li style={styles.modePoint}>모듈을 LD가 직접 체크/언체크</li>
                <li style={styles.modePoint}>고객사 맞춤 단계 별도</li>
              </ul>
              <div style={styles.modeUseCase}>
                이미 알려진 주제·일반적인 직무 — 빠르게 만들 때
              </div>
            </div>
          </div>

          <div style={{ ...styles.modeCard, ...styles.modeCardLite }}>
            <div style={styles.modeTagLite}>새 커리큘럼 만들기</div>
            <div style={styles.modeBody}>
              <p style={styles.modeBlurbLite}>
                표준에 없는 <strong>주제·툴 조합</strong>도 자유 입력. AI가 시수에 맞춰 전체를 자동 설계합니다.
              </p>
              <ul style={styles.modePointsLite}>
                <li style={styles.modePointLite}>약 <strong>2분</strong> 소요 (입력 → 결과)</li>
                <li style={styles.modePointLite}>모듈 개수·구성은 AI가 결정</li>
                <li style={styles.modePointLite}>고객사 정보·보안 환경 한 번에 반영</li>
              </ul>
              <div style={styles.modeUseCaseLite}>
                신규 주제·비표준 직무·특수 요구 — 표준에 없을 때
              </div>
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" style={styles.primaryBtn} onClick={onClose}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    boxSizing: 'border-box',
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: 720,
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '28px 30px',
    position: 'relative',
    boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    background: 'transparent',
    border: 'none',
    fontSize: 24,
    color: '#9ca3af',
    cursor: 'pointer',
    width: 32,
    height: 32,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1f3864',
    margin: 0,
    marginBottom: 8,
    paddingRight: 30,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 20,
  },
  inlineEmph: {
    color: '#1f3864',
  },
  modeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 20,
  },
  modeCard: {
    border: '2px solid',
    borderRadius: 10,
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modeCardStandard: {
    borderColor: '#c7d2fe',
    background: '#fff',
  },
  modeCardLite: {
    borderColor: '#1f3864',
    background: '#fff',
  },
  modeTagStandard: {
    background: '#f0f4ff',
    color: '#1f3864',
    fontSize: 14,
    fontWeight: 700,
    padding: '10px 14px',
    borderBottom: '1px solid #c7d2fe',
  },
  modeTagLite: {
    background: 'linear-gradient(135deg, #1f3864 0%, #2E75B6 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    padding: '10px 14px',
  },
  modeBody: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
  },
  modeBlurb: {
    fontSize: 13,
    color: '#374151',
    margin: 0,
    lineHeight: 1.55,
  },
  modeBlurbLite: {
    fontSize: 13,
    color: '#374151',
    margin: 0,
    lineHeight: 1.55,
  },
  modePoints: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.7,
  },
  modePointsLite: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.7,
  },
  modePoint: {
    marginBottom: 0,
  },
  modePointLite: {
    marginBottom: 0,
  },
  modeUseCase: {
    background: '#f9fafb',
    border: '1px dashed #d1d5db',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 11.5,
    color: '#1f3864',
    fontWeight: 600,
    marginTop: 'auto',
  },
  modeUseCaseLite: {
    background: '#f0f4ff',
    border: '1px dashed #1f3864',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 11.5,
    color: '#1f3864',
    fontWeight: 600,
    marginTop: 'auto',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
  primaryBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 36px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
