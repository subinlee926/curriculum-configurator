import { useState, useEffect } from 'react';
import { detectSecurityKeywords } from '../utils/detectSecurityKeywords';
import HelpTip from './HelpTip';

const LEVEL_OPTIONS = ['입문', '중급', '고급'];
const HOURS_PRESETS = [4, 6, 8, 12, 16];

export default function BuilderLiteIntake({ initial, onAssembled, onCancel }) {
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    toolsText: initial?.toolsText ?? '',
    topic: initial?.topic ?? '',
    level: initial?.level ?? '중급',
  });
  const [hours, setHours] = useState(initial?.hours ?? 8);
  const [customHoursText, setCustomHoursText] = useState(
    initial?.hours && !HOURS_PRESETS.includes(initial.hours) ? String(initial.hours) : ''
  );
  const [securityText, setSecurityText] = useState(initial?.securityText ?? '');
  const [detectedTags, setDetectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 보안 텍스트 변경 시 300ms debounce로 키워드 감지
  useEffect(() => {
    const timer = setTimeout(() => {
      const { tags } = detectSecurityKeywords(securityText);
      setDetectedTags(tags);
    }, 300);
    return () => clearTimeout(timer);
  }, [securityText]);

  const parsedTools = form.toolsText
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const intakeValid =
    form.role.trim().length > 0 &&
    parsedTools.length > 0 &&
    form.topic.trim().length > 0 &&
    hours >= 2 &&
    hours <= 40;

  const isCustomActive = customHoursText.trim().length > 0;

  const handleField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handlePresetClick = (preset) => {
    setHours(preset);
    setCustomHoursText('');
  };

  const handleCustomChange = (e) => {
    const text = e.target.value;
    setCustomHoursText(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 40) {
      setHours(parsed);
    }
  };

  const handleGenerate = async () => {
    if (!intakeValid || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/builder-lite-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company: form.company.trim() || '범용',
          role: form.role.trim(),
          tools: parsedTools,
          topic: form.topic.trim(),
          level: form.level,
          hours,
          securityText: securityText.trim(),
          detectedTags,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `서버 오류 (${res.status})`);
      }
      const data = await res.json();
      if (!Array.isArray(data.modules) || data.modules.length === 0) {
        throw new Error('AI가 모듈을 생성하지 못했습니다. 다시 시도해주세요.');
      }
      onAssembled({
        intake: {
          company: form.company.trim(),
          role: form.role.trim(),
          tools: parsedTools,
          toolsText: form.toolsText,
          topic: form.topic.trim(),
          level: form.level,
          hours,
          securityText: securityText.trim(),
          detectedTags,
        },
        modules: data.modules,
        hoursSum: data.hoursSum,
        hoursMismatch: data.hoursMismatch,
        topicName: form.topic.trim(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>새 커리큘럼 만들기</h2>
          <p style={styles.subtitle}>
            5가지 정보를 입력하면 AI가 시수에 맞춰 전체 커리큘럼을 한 번에 생성합니다. 약 30~60초 소요.
          </p>
        </div>
        <button type="button" style={styles.cancelBtn} onClick={onCancel}>
          ← 표준 커리큘럼으로
        </button>
      </div>

      <div style={styles.formCard}>
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>회사명 (선택)</label>
            <input
              type="text"
              value={form.company}
              onChange={handleField('company')}
              placeholder="예: LG생활건강  /  비워두면 '범용'"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>직무 *</label>
            <input
              type="text"
              value={form.role}
              onChange={handleField('role')}
              placeholder="예: 디자이너 / 게임 기획자 / 브랜드 마케터"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>활용 툴 * (복수면 쉼표로 구분)</label>
            <input
              type="text"
              value={form.toolsText}
              onChange={handleField('toolsText')}
              placeholder="예: Figma, Nano Banana"
              style={styles.input}
              disabled={loading}
            />
            {parsedTools.length > 0 && (
              <div style={styles.chipRow}>
                {parsedTools.map((t) => (
                  <span key={t} style={styles.chip}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ ...styles.field, gridColumn: '1 / span 2' }}>
            <label style={styles.label}>주제 *</label>
            <input
              type="text"
              value={form.topic}
              onChange={handleField('topic')}
              placeholder="예: 브랜드 굿즈 디자인 / 라이브 게임 기획 / 캠페인 자동화"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>수준</label>
            <select
              value={form.level}
              onChange={handleField('level')}
              style={styles.input}
              disabled={loading}
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>
              총 시수 *
              <HelpTip
                placement="right"
                text="시수만 입력하면 AI가 모듈 개수와 구성을 자동 결정합니다. 예) 6H는 4개, 12H는 5~6개. 모듈을 직접 고르는 게 아니라 결과를 받아보고 마음에 안 들면 [재생성 의견]으로 방향성을 줄 수 있어요."
              />
            </label>
            <div style={styles.hoursRow}>
              <div style={styles.presetGroup}>
                {HOURS_PRESETS.map((preset) => {
                  const isActive = !isCustomActive && hours === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={loading}
                      onClick={() => handlePresetClick(preset)}
                      style={{
                        ...styles.presetBtn,
                        ...(isActive ? styles.presetBtnActive : {}),
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {preset}H
                    </button>
                  );
                })}
              </div>
              <div style={styles.customGroup}>
                <span style={styles.customLabel}>또는 custom</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customHoursText}
                  onChange={handleCustomChange}
                  placeholder="예: 10"
                  style={styles.customInput}
                  disabled={loading}
                />
                <span style={styles.customLabel}>H</span>
              </div>
            </div>
            <div style={styles.hoursHint}>
              현재 선택: <strong style={styles.hoursHintValue}>{hours}H</strong>
              {' '}— 모듈 개수와 구성은 AI가 시수에 맞춰 자동 결정합니다.
            </div>
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <label style={styles.label}>보안 환경 (선택)</label>
            <textarea
              value={securityText}
              onChange={(e) => setSecurityText(e.target.value)}
              placeholder={'예: 폐쇄망 환경, ChatGPT 차단, M365 보유 / Copilot 미포함\n비워두면 보안 제약 없이 생성됩니다.'}
              style={styles.securityTextarea}
              disabled={loading}
            />
            {detectedTags.length > 0 && (
              <div style={styles.secTagRow}>
                <span style={styles.secTagLabel}>감지된 보안 태그</span>
                {detectedTags.map((tag) => (
                  <span
                    key={tag.태그}
                    style={styles.secTagChip}
                    title={
                      [
                        tag.설명,
                        tag.효과?.제외Tool?.length
                          ? `제외: ${tag.효과.제외Tool.join(', ')}`
                          : null,
                        tag.효과?.대체Tool?.length
                          ? `대체: ${tag.효과.대체Tool.join(', ')}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                    }
                  >
                    {tag.태그}
                  </span>
                ))}
              </div>
            )}
            {securityText.trim() && detectedTags.length === 0 && (
              <div style={styles.secNoTag}>
                특별한 보안 키워드는 감지되지 않았습니다. 입력 내용은 그대로 AI 생성에 반영됩니다.
              </div>
            )}
          </div>
        </div>

        <div style={styles.formActions}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!intakeValid || loading}
            style={{
              ...styles.primaryBtn,
              opacity: !intakeValid || loading ? 0.5 : 1,
              cursor: !intakeValid || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? `커리큘럼 생성 중… (약 30~60초)` : '커리큘럼 생성 →'}
          </button>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '8px 0' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: 700, color: '#1f3864', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  cancelBtn: {
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
  formCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '20px 22px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 14,
    marginBottom: 16,
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
  chipRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  hoursRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  presetGroup: {
    display: 'inline-flex',
    gap: 6,
  },
  presetBtn: {
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    minWidth: 52,
    transition: 'all 0.12s',
  },
  presetBtnActive: {
    background: '#1f3864',
    color: '#fff',
    borderColor: '#1f3864',
  },
  customGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  customLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  customInput: {
    width: 60,
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
  hoursHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  hoursHintValue: {
    color: '#1f3864',
    fontWeight: 700,
  },
  securityTextarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    minHeight: 70,
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  secTagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  secTagLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  secTagChip: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'help',
  },
  secNoTag: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 6,
  },
  formActions: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' },
  primaryBtn: {
    background: '#1f3864',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '11px 22px',
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
};
