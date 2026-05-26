import securityKeywords from '../data/securityKeywords.json';

const NEGATION_WORDS = ['불가', '차단', '금지', '제한', '미허용'];

// "구글, 노션 불가" → "구글 불가, 노션 불가" 같은 쉼표 나열 부정 패턴을 확장.
// Step4Security.jsx의 detectKeywords 전처리 로직과 동일 동작.
export function expandNegationPatterns(text) {
  let expanded = text;
  NEGATION_WORDS.forEach((neg) => {
    const regex = new RegExp(
      `([가-힣A-Za-z0-9]+(?:\\s*[,·/]\\s*[가-힣A-Za-z0-9]+)+)\\s+${neg}`,
      'g'
    );
    expanded = expanded.replace(regex, (match, itemList) => {
      const items = itemList.split(/\s*[,·/]\s*/);
      return items.map((item) => `${item.trim()} ${neg}`).join(', ');
    });
  });
  return expanded;
}

// 자유 텍스트에서 보안 키워드를 감지하여 매칭된 태그(고유)와 매칭 키워드(모두)를 반환.
// 반환값:
//   tags: 매칭된 보안 태그 정의 배열 (중복 제거, 효과·설명 등 모든 필드 포함)
//   keywords: 매칭된 키워드 정의 배열 (중복 허용, 하이라이트용)
export function detectSecurityKeywords(text) {
  if (!text || !text.trim()) {
    return { tags: [], keywords: [] };
  }
  const expanded = expandNegationPatterns(text);
  const searchText = expanded.toLowerCase();

  const tags = [];
  const seenTags = new Set();
  securityKeywords.forEach((kw) => {
    if (searchText.includes(kw.키워드.toLowerCase())) {
      if (!seenTags.has(kw.태그)) {
        seenTags.add(kw.태그);
        tags.push(kw);
      }
    }
  });

  const keywords = securityKeywords.filter((kw) =>
    searchText.includes(kw.키워드.toLowerCase())
  );

  return { tags, keywords };
}
