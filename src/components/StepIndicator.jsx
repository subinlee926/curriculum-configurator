const STEPS = [
  { num: 1, label: '주제 선택' },
  { num: 2, label: '모듈 선택' },
  { num: 3, label: '도구 설정' },
  { num: 4, label: '보안 환경' },
  { num: 5, label: '커리큘럼 확인' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div style={styles.wrapper}>
      {STEPS.map((step, idx) => {
        const isDone = currentStep > step.num;
        const isActive = currentStep === step.num;
        return (
          <div key={step.num} style={styles.stepGroup}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  ...styles.circle,
                  background: isDone ? '#2E75B6' : isActive ? '#1f3864' : '#d1d5db',
                  color: isDone || isActive ? '#fff' : '#6b7280',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {isDone ? '✓' : step.num}
              </div>
              <span
                style={{
                  ...styles.label,
                  color: isActive ? '#1f3864' : isDone ? '#2E75B6' : '#9ca3af',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  ...styles.connector,
                  background: currentStep > step.num ? '#2E75B6' : '#d1d5db',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px 8px',
    gap: 0,
    flexWrap: 'nowrap',
    overflowX: 'auto',
  },
  stepGroup: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    whiteSpace: 'nowrap',
    transition: 'color 0.2s',
  },
  connector: {
    height: 2,
    width: 48,
    marginBottom: 20,
    transition: 'background 0.2s',
    flexShrink: 0,
  },
};
