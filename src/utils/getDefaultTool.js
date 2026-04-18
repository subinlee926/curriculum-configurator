import moduleDefaultTool from '../data/moduleDefaultTool.json';
import topicToolMapping from '../data/topicToolMapping.json';

export function getTopicDefaultTool(topicCode) {
  const topicInfo = topicToolMapping.find((t) => t.주제코드 === topicCode);
  return topicInfo ? topicInfo.기본Tool : '';
}

export function getModuleDefaultTool(moduleId, topicCode) {
  if (moduleDefaultTool[moduleId]) return moduleDefaultTool[moduleId];
  return getTopicDefaultTool(topicCode);
}
