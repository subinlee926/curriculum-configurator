import { useState, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import Step1TopicSelect from './components/Step1TopicSelect';
import Step2ModuleSelect from './components/Step2ModuleSelect';
import Step3ToolSelect from './components/Step3ToolSelect';
import Step4Security from './components/Step4Security';
import Step5Result from './components/Step5Result';
import { getModuleDefaultTool } from './utils/getDefaultTool';

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [toolSelections, setToolSelections] = useState({});
  const [securityText, setSecurityText] = useState('');
  const [detectedTags, setDetectedTags] = useState([]);

  const handleTopicSelect = (topicCode) => {
    setSelectedTopic(topicCode);
    setSelectedModules([]);
    setToolSelections({});
  };

  const handleModuleToggle = (moduleId) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        setToolSelections((prevTools) => {
          const copy = { ...prevTools };
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
  };

  const handleTagsDetected = useCallback((tags, _keywords) => {
    setDetectedTags(tags);
  }, []);

  const handleReset = () => {
    setStep(1);
    setSelectedTopic(null);
    setSelectedModules([]);
    setToolSelections({});
    setSecurityText('');
    setDetectedTags([]);
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

      {/* Step indicator */}
      <div style={styles.stepBarWrapper}>
        <div style={styles.stepBarInner}>
          <StepIndicator currentStep={step} />
        </div>
      </div>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.contentCard}>
          {step === 1 && (
            <Step1TopicSelect
              selectedTopic={selectedTopic}
              onSelect={handleTopicSelect}
              onNext={() => setStep(2)}
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
              onBack={() => setStep(4)}
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
