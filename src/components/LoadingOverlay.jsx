import { useEffect, useState } from 'react';

/**
 * 카드 내부 dim 오버레이 + 회전 spinner + 페이즈 메시지 rotation.
 *
 * 부모 컨테이너는 position:relative 여야 합니다 (오버레이가 그 영역만 덮음).
 *
 * Props:
 *   isVisible : 로딩 상태
 *   phases    : [{ startSec: number, text: string }] — 시간 누적에 따라 다음 phase로 전환
 *   fallbackMessage : phases 없거나 매칭 phase 없을 때 표시
 *   compact   : 컴팩트 모드 (작은 spinner — 행 단위 같은 좁은 영역에서)
 *
 * 동작:
 *   - isVisible=true 시 경과 시간 카운트 시작
 *   - 매 500ms마다 elapsed 갱신, 현재 phase 결정
 *   - 가장 큰 startSec ≤ elapsed인 phase 선택
 *   - elapsed가 마지막 phase 시작점을 한참 넘어도 메시지는 마지막 phase 유지
 */
export default function LoadingOverlay({
  isVisible,
  phases,
  fallbackMessage = '생성 중',
  compact = false,
}) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setElapsedSec(0);
      return;
    }
    const start = Date.now();
    setElapsedSec(0);
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [isVisible]);

  if (!isVisible) return null;

  let currentPhase = null;
  if (Array.isArray(phases) && phases.length > 0) {
    for (let i = phases.length - 1; i >= 0; i--) {
      if (elapsedSec >= phases[i].startSec) {
        currentPhase = phases[i];
        break;
      }
    }
    if (!currentPhase) currentPhase = phases[0];
  }
  const message = currentPhase?.text || fallbackMessage;

  return (
    <div
      style={{
        ...styles.overlay,
        animation: 'configurator-fade-in 0.2s ease-out',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div style={compact ? styles.contentCompact : styles.content}>
        <div
          style={{
            ...(compact ? styles.spinnerCompact : styles.spinner),
            animation: 'configurator-spin 0.9s linear infinite',
          }}
        />
        <div style={compact ? styles.messageCompact : styles.message}>{message}</div>
        {!compact && (
          <div style={styles.subline}>
            <span style={{ ...styles.dot, animation: 'configurator-dot-bounce 1.2s ease-in-out infinite', animationDelay: '0s' }} />
            <span style={{ ...styles.dot, animation: 'configurator-dot-bounce 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
            <span style={{ ...styles.dot, animation: 'configurator-dot-bounce 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
            <span style={styles.elapsed}>{elapsedSec}초 경과</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.86)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    borderRadius: 'inherit',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: '24px 28px',
    minWidth: 240,
    maxWidth: '80%',
  },
  contentCompact: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px',
  },
  spinner: {
    width: 44,
    height: 44,
    border: '4px solid #e5e7eb',
    borderTopColor: '#1f3864',
    borderRadius: '50%',
  },
  spinnerCompact: {
    width: 18,
    height: 18,
    border: '2.5px solid #e5e7eb',
    borderTopColor: '#1f3864',
    borderRadius: '50%',
  },
  message: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f3864',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  messageCompact: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f3864',
  },
  subline: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#2E75B6',
    display: 'inline-block',
  },
  elapsed: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
  },
};
