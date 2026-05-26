import { useState, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1TopicSelect from './components/Step1TopicSelect';
import Step2ModuleSelect from './components/Step2ModuleSelect';
import Step3ToolSelect from './components/Step3ToolSelect';
import Step4Security from './components/Step4Security';
import Step5Result from './components/Step5Result';
import Step6Customization from './components/Step6Customization';
import BuilderLiteIntake from './components/BuilderLiteIntake';
import { getModuleDefaultTool } from './utils/getDefaultTool';

const DEFAULT_CUSTOMIZATION = {
  company: '',
  role: '',
  level: '중급',
  audience: '',
};

const LITE_TOPIC_CODE = 'LITE';
const LITE_MODULE_IDS = ['LITE-M1', 'LITE-M2', 'LITE-M3', 'LITE-M4'];

export default function App() {
  const [mode, setMode] = useState('standard'); // 'standard' | 'builder-lite'
  const [step, setStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [toolSelections, setToolSelections] = useState({});
  const [securityText, setSecurityText] = useState('');
  const [detectedTags, setDetectedTags] = useState([]);
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);
  const [customizedModules, setCustomizedModules] = useState(null);
  const [viewMode, setViewMode] = useState('original');
  // Tool 기반 재작성 결과 (moduleId → {rewrittenContent, toolAtRewrite})
  // toolAtRewrite는 재작성 당시의 Tool이며, 현재 toolSelections와 다르면 stale 처리
  const [toolRewrittenContent, setToolRewrittenContent] = useState({});

  // Builder Lite 전용 상태
  const [liteIntake, setLiteIntake] = useState(null); // { company, role, tools, toolsText, topic, level }
  const [liteTopicName, setLiteTopicName] = useState('');
  const [liteModules, setLiteModules] = useState(null); // synthetic moduleMaster 엔트리 4개
  const [liteSelectedM4, setLiteSelectedM4] = useState(null);

  const customModules = liteModules
    ? Object.fromEntries(liteModules.map((m) => [m.모듈ID, m]))
    : null;
  const customTopicMeta = mode === 'builder-lite' && liteTopicName
    ? { 코드: LITE_TOPIC_CODE, 명: liteTopicName }
    : null;

  const handleTopicSelect = (topicCode) => {
    setSelectedTopic(topicCode);
    setSelectedModules([]);
    setToolSelections({});
    setToolRewrittenContent({});
  };

  const handleModuleToggle = (moduleId) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        setToolSelections((prevTools) => {
          const copy = { ...prevTools };
          delete copy[moduleId];
          return copy;
        });
        // 제거된 모듈의 재작성 결과도 함께 정리
        setToolRewrittenContent((prev) => {
          const copy = { ...prev };
          delete copy[moduleId];
          return copy;
        });
        return prev.filter((id) => id !== moduleId);
      } else {
        setToolSelections((prevTools) => ({
          ...prevTools,
          [moduleId]: getModuleDefaultTool(moduleId, selectedTopic),
        }));
        return [...prev, moduleId];
      }
    });
  };

  const handleToolChange = (moduleId, tool) => {
    setToolSelections((prev) => ({ ...prev, [moduleId]: tool }));
    // Tool 변경 시 해당 모듈의 재작성 결과 invalidate
    setToolRewrittenContent((prev) => {
      if (!prev[moduleId]) return prev;
      const copy = { ...prev };
      delete copy[moduleId];
      return copy;
    });
  };

  const handleTagsDetected = useCallback((tags, _keywords) => {
    setDetectedTags(tags);
  }, []);

  const handleReset = () => {
    setMode('standard');
    setStep(1);
    setSelectedTopic(null);
    setSelectedModules([]);
    setToolSelections({});
    setSecurityText('');
    setDetectedTags([]);
    setCustomization(DEFAULT_CUSTOMIZATION);
    setCustomizedModules(null);
    setViewMode('original');
    setToolRewrittenContent({});
    setLiteIntake(null);
    setLiteTopicName('');
    setLiteModules(null);
    setLiteSelectedM4(null);
  };

  const handleModeSelect = (newMode) => {
    setMode(newMode);
    setSelectedTopic(null);
    setSelectedModules([]);
    setToolSelections({});
    setToolRewrittenContent({});
    setLiteModules(null);
    setLiteSelectedM4(null);
  };

  const handleLiteAssembled = ({ intake, selectedM4, modules, topicName }) => {
    // 합성 모듈을 기존 moduleMaster 스키마(한글 키)로 변환
    const synthetic = modules.map((m) => ({
      모듈ID: m.moduleId,
      모듈명: m.moduleName,
      기본시수: m.defaultHours,
      필수여부: true,
      난이도: m.difficulty,
      학습내용: m.learningContent,
      학습내용키워드: m.learningContent,
    }));
    const toolLabel = intake.tools.join(', ');
    const toolMap = {};
    LITE_MODULE_IDS.forEach((id) => { toolMap[id] = toolLabel; });

    setLiteIntake(intake);
    setLiteTopicName(topicName);
    setLiteModules(synthetic);
    setLiteSelectedM4(selectedM4);
    setSelectedTopic(LITE_TOPIC_CODE);
    setSelectedModules(LITE_MODULE_IDS);
    setToolSelections(toolMap);
    setToolRewrittenContent({}); // lite 모드는 재작성 미사용
    setSecurityText('');
    setDetectedTags([]);
    // intake 정보를 Step6 customization 폼에 미리 채워둠 (LD가 수정 가능)
    setCustomization({
      company: intake.company || '',
      role: intake.role || '',
      level: intake.level || '중급',
      audience: '',
    });
    setStep(5);
  };

  const handleLiteCancel = () => {
    setMode('standard');
    setLiteIntake(null);
    setLiteTopicName('');
    setLiteModules(null);
    setLiteSelectedM4(null);
  };

  return (
    <div style={styles.appShell}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoArea}>
            <div style={styles.logoText}>FastCampus B2B</div>
            <div style={styles.appTitle}>AI 커리큘럼 설정기</div>
          </div>
          <div style={styles.headerRight}></div>
        </div>
      </header>

      {/* Step indicator — 표준 모드에서만 노출 (Lite 모드는 2·3·4 단계를 건너뜀) */}
      {mode === 'standard' && (
        <div style={styles.stepBarWrapper}>
          <div style={styles.stepBarInner}>
            <StepIndicator currentStep={step} />
          </div>
        </div>
      )}
      {mode === 'builder-lite' && (
        <div style={styles.liteBadgeWrapper}>
          <div style={styles.liteBadge}>새 커리큘럼 만들기 모드 (Builder Lite)</div>
        </div>
      )}

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.contentCard}>
          {step === 1 && mode === 'standard' && (
            <Step1TopicSelect
              selectedTopic={selectedTopic}
              onSelect={handleTopicSelect}
              onNext={() => setStep(2)}
              onModeSelect={handleModeSelect}
            />
          )}
          {step === 1 && mode === 'builder-lite' && (
            <BuilderLiteIntake
              initial={
                liteIntake
                  ? {
                      ...liteIntake,
                      toolsText:
                        liteIntake.toolsText ?? (liteIntake.tools ? liteIntake.tools.join(', ') : ''),
                    }
                  : null
              }
              onAssembled={handleLiteAssembled}
              onCancel={handleLiteCancel}
            />
          )}
          {step === 2 && (
            <Step2ModuleSelect
              selectedTopic={selectedTopic}
              selectedModules={selectedModules}
              onModuleToggle={handleModuleToggle}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3ToolSelect
              selectedTopic={selectedTopic}
              selectedModules={selectedModules}
              toolSelections={toolSelections}
              onToolChange={handleToolChange}
              toolRewrittenContent={toolRewrittenContent}
              setToolRewrittenContent={setToolRewrittenContent}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4Security
              securityText={securityText}
              onSecurityTextChange={setSecurityText}
              detectedTags={detectedTags}
              onTagsDetected={handleTagsDetected}
              toolSelections={toolSelections}
              selectedModules={selectedModules}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}
          {step === 5 && (
            <Step5Result
              selectedTopic={selectedTopic}
              selectedModules={selectedModules}
              toolSelections={toolSelections}
              detectedTags={detectedTags}
              securityText={securityText}
              toolRewrittenContent={toolRewrittenContent}
              customModules={customModules}
              customTopicMeta={customTopicMeta}
              onBack={mode === 'builder-lite' ? () => setStep(1) : () => setStep(4)}
              onBackLabel={mode === 'builder-lite' ? '이전 (입력 수정)' : undefined}
              onNext={() => setStep(6)}
              onReset={handleReset}
            />
          )}
          {step === 6 && (
            <Step6Customization
              selectedTopic={selectedTopic}
              selectedModules={selectedModules}
              toolSelections={toolSelections}
              detectedTags={detectedTags}
              customization={customization}
              setCustomization={setCustomization}
              customizedModules={customizedModules}
              setCustomizedModules={setCustomizedModules}
              viewMode={viewMode}
              setViewMode={setViewMode}
              toolRewrittenContent={toolRewrittenContent}
              customModules={customModules}
              customTopicMeta={customTopicMeta}
              onBack={() => setStep(5)}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>FastCampus B2B AI 교육 커리큘럼 설정기 · 2026</span>
      </footer>
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: '100vh',
    background: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
  },
  header: {
    background: '#1f3864',
    borderBottom: '3px solid #2E75B6',
  },
  headerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  logoText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  modeBadge: {
    background: '#2E75B6',
    color: '#e0e7ff',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
  },
  stepBarWrapper: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  stepBarInner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  liteBadgeWrapper: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: '10px 16px',
    textAlign: 'center',
  },
  liteBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #1f3864 0%, #2E75B6 100%)',
    color: '#fff',
    borderRadius: 20,
    padding: '5px 16px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  contentCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
    padding: '28px 32px',
  },
  footer: {
    background: '#1f3864',
    color: '#93c5fd',
    textAlign: 'center',
    padding: '12px 16px',
    fontSize: 12,
  },
};
