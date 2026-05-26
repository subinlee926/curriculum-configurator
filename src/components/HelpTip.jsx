import { useState, useRef, useEffect } from 'react';

/**
 * 작은 ? 아이콘 + tooltip. hover OR click으로 표시.
 * - text: tooltip 본문 (필수)
 * - placement: 'top' | 'bottom' | 'right' (기본 top)
 *
 * 클릭은 touch 환경 대응. 클릭 후 외부 클릭 시 자동 닫힘.
 */
export default function HelpTip({ text, placement = 'top' }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const tooltipPositionStyle =
    placement === 'bottom'
      ? styles.tooltipBottom
      : placement === 'right'
        ? styles.tooltipRight
        : styles.tooltipTop;

  return (
    <span
      ref={wrapperRef}
      style={styles.wrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        style={styles.icon}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-label="도움말"
      >
        ?
      </button>
      {open && (
        <span style={{ ...styles.tooltip, ...tooltipPositionStyle }}>{text}</span>
      )}
    </span>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: 4,
    verticalAlign: 'middle',
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    background: '#cbd5e1',
    color: '#1f3864',
    border: 'none',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'help',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    transition: 'background 0.12s',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 100,
    background: '#1f3864',
    color: '#fff',
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
    padding: '8px 12px',
    borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    width: 240,
    whiteSpace: 'normal',
    textAlign: 'left',
  },
  tooltipTop: {
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  tooltipBottom: {
    top: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  tooltipRight: {
    left: 'calc(100% + 8px)',
    top: '50%',
    transform: 'translateY(-50%)',
  },
};
