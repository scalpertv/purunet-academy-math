// 문제 유형을 스토리텔링 학습 장면으로 바꾸는 메타데이터

import type { LearningArea, Topic, Unit } from "./types";

export interface StoryInfo {
  chapter: string;
  scene: string;
  narration: string;
  guide: string;
  reward: string;
  icon: string;
}

export interface ChapterInfo {
  unitNo: number;
  title: string;
  scene: string;
  teaser: string;
  icon: string;
}

export interface StemStoryTopicMission {
  topicId: string;
  title: string;
  narrative: string;
  stemSkill: string;
  formula: string;
  dataPrompt: string;
}

export interface StemStoryChapter {
  unitId: string;
  unitNo: number;
  unitLabel: string;
  course: string;
  month: string;
  title: string;
  scene: string;
  teaser: string;
  narrative: string;
  stemFocus: string[];
  engineeringChallenge: string;
  dataQuestion: string;
  formula: string;
  formulaMeaning: string;
  chartTitle: string;
  chartItems: Array<{ label: string; value: number }>;
  lineTitle: string;
  linePoints: Array<{ label: string; value: number }>;
  topicMissions: StemStoryTopicMission[];
  visualKind: "lab" | "city" | "space" | "eco" | "energy" | "future";
  icon: string;
}

export const CHAPTERS: ChapterInfo[] = [
  {
    unitNo: 1,
    title: "별빛 시장의 계산 주문",
    scene: "계산 순서를 지키면 잠긴 가게 문이 하나씩 열립니다.",
    teaser: "괄호와 곱셈·나눗셈을 먼저 처리하는 모험",
    icon: "✦",
  },
  {
    unitNo: 2,
    title: "숲속 열쇠와 배수 다리",
    scene: "약수 열쇠와 배수 발판을 찾아 숲길을 건너갑니다.",
    teaser: "약수, 배수, 공약수, 공배수로 길 찾기",
    icon: "◆",
  },
  {
    unitNo: 3,
    title: "무지개 마을의 대응 규칙",
    scene: "두 양이 함께 변하는 규칙을 찾아 무지개 다리를 완성합니다.",
    teaser: "표와 식으로 관계를 읽는 이야기",
    icon: "◇",
  },
  {
    unitNo: 4,
    title: "달빛 분수 정원의 분수 마법",
    scene: "분수 조각의 크기를 맞추면 달빛 분수가 다시 빛납니다.",
    teaser: "약분, 통분, 크기 비교를 쓰는 분수 모험",
    icon: "☾",
  },
  {
    unitNo: 5,
    title: "구름 제과점의 분수 레시피",
    scene: "서로 다른 분수 재료를 더하고 빼서 완벽한 레시피를 완성합니다.",
    teaser: "진분수와 대분수의 덧셈·뺄셈 모험",
    icon: "✧",
  },
  {
    unitNo: 6,
    title: "황금 들판의 넓이 지도",
    scene: "둘레 길과 넓이 밭을 재며 도형 마을의 지도를 완성합니다.",
    teaser: "다각형의 둘레와 넓이를 계산하는 모험",
    icon: "▣",
  },
  {
    unitNo: 7,
    title: "어림 시계탑의 범위 문",
    scene: "이상·이하·초과·미만 문을 지나 반올림 시계탑에 오릅니다.",
    teaser: "수의 범위와 어림셈을 구분하는 이야기",
    icon: "⌁",
  },
  {
    unitNo: 8,
    title: "분수 별농장의 곱셈 씨앗",
    scene: "분수 씨앗을 몇 배로 심어 별빛 밭을 키웁니다.",
    teaser: "분수의 곱셈과 전체의 몇 분의 몇",
    icon: "✶",
  },
  {
    unitNo: 9,
    title: "거울 성의 합동과 대칭",
    scene: "거울에 비친 도형의 대응변과 대칭축을 찾아 성문을 엽니다.",
    teaser: "합동, 선대칭, 점대칭을 읽는 모험",
    icon: "◇",
  },
  {
    unitNo: 10,
    title: "소수 항구의 곱셈 배달",
    scene: "소수 길이의 상자를 실어 정확한 넓이와 값을 배달합니다.",
    teaser: "소수와 자연수, 소수끼리의 곱셈",
    icon: "✺",
  },
  {
    unitNo: 11,
    title: "입체 상자의 직육면체 창고",
    scene: "면과 모서리, 꼭짓점을 확인하며 창고 상자를 정리합니다.",
    teaser: "직육면체와 쌓기나무를 다루는 이야기",
    icon: "▤",
  },
  {
    unitNo: 12,
    title: "확률 축제의 평균 무대",
    scene: "평균 점수를 맞추고 가능성 표지판을 골라 축제를 준비합니다.",
    teaser: "평균과 가능성을 판단하는 모험",
    icon: "✹",
  },
  {
    unitNo: 13,
    title: "별빛 기록관의 5학년 총정리",
    scene: "올해 배운 계산, 분수, 넓이, 소수를 한 권의 기록으로 묶습니다.",
    teaser: "5학년 핵심 유형 누적 복습",
    icon: "★",
  },
  {
    unitNo: 14,
    title: "새 학년 관문의 6학년 준비",
    scene: "분수 나눗셈과 비, 그래프, 부피의 첫 관문을 가볍게 통과합니다.",
    teaser: "6학년 선행 기초를 맛보는 마무리",
    icon: "✚",
  },
];

const AREA_LABELS: Record<LearningArea, string> = {
  basic: "기초 데이터",
  concept: "개념 모델링",
  type: "유형 알고리즘",
  challenge: "확장 설계",
};

const STORY_WORLDS: Record<number, { world: string; role: string; goal: string; visualKind: StemStoryChapter["visualKind"]; icon: string }> = {
  1: {
    world: "숫자 감각 연구소",
    role: "어린 수학 탐험가",
    goal: "눈에 보이는 물건과 수를 연결해 생활 문제를 해결합니다.",
    visualKind: "lab",
    icon: "1",
  },
  2: {
    world: "생활 발명 메이커랩",
    role: "마을 발명가",
    goal: "측정, 분류, 곱셈의 아이디어를 생활 도구 설계에 사용합니다.",
    visualKind: "city",
    icon: "2",
  },
  3: {
    world: "우주 데이터 관측소",
    role: "우주 자료 분석가",
    goal: "곱셈·나눗셈, 분수, 그래프를 관측 자료로 해석합니다.",
    visualKind: "space",
    icon: "3",
  },
  4: {
    world: "환경 공학 설계실",
    role: "친환경 구조 엔지니어",
    goal: "큰 수, 각도, 도형, 자료를 이용해 지속가능한 구조를 설계합니다.",
    visualKind: "eco",
    icon: "4",
  },
  5: {
    world: "스마트 에너지 도시",
    role: "데이터 기반 도시 설계자",
    goal: "분수, 소수, 넓이, 평균을 연결해 도시 시스템을 최적화합니다.",
    visualKind: "energy",
    icon: "5",
  },
  6: {
    world: "미래 수학 시스템 센터",
    role: "AI 협업 문제해결가",
    goal: "비, 그래프, 공간, 식을 이용해 복잡한 문제를 모델링합니다.",
    visualKind: "future",
    icon: "6",
  },
};

function gradeNumberOf(unit: Unit) {
  const fromId = unit.id.match(/^g([1-6])-/)?.[1];
  const fromCourse = unit.course?.match(/[1-6]/)?.[0];
  return Number(fromId ?? fromCourse ?? 5);
}

function unitLabelText(unit: Unit) {
  if (unit.label) return unit.label;
  if (unit.course && unit.month) return `${unit.course} ${unit.month}`;
  return `${unit.no}단원`;
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function formulaProfile(unit: Unit) {
  const text = `${unit.title} ${unit.subtitle} ${unit.topics.map((topic) => `${topic.title} ${topic.desc}`).join(" ")}`;
  if (includesAny(text, ["분수", "약분", "통분"])) {
    return {
      formula: "a/b = (a×n)/(b×n),  a/b + c/b = (a+c)/b",
      meaning: "분수 조각을 같은 기준으로 바꾸고 필요한 만큼 합치거나 비교합니다.",
    };
  }
  if (includesAny(text, ["비", "비율", "백분율", "%", "퍼센트"])) {
    return {
      formula: "비율 = 비교하는 양 ÷ 기준량,  백분율 = 비율 × 100",
      meaning: "두 양의 관계를 한눈에 비교할 수 있는 수학 모델로 바꿉니다.",
    };
  }
  if (includesAny(text, ["넓이", "둘레", "각도", "도형", "삼각형", "사각형", "원"])) {
    return {
      formula: "둘레 = 변의 길이의 합,  넓이 = 밑변 × 높이 ÷ 2 또는 가로 × 세로",
      meaning: "공간을 재고 나누어 실제 설계 도면의 크기를 예측합니다.",
    };
  }
  if (includesAny(text, ["부피", "직육면체", "쌓기", "입체", "원기둥"])) {
    return {
      formula: "부피 = 가로 × 세로 × 높이,  겉넓이 = 보이는 면의 넓이 합",
      meaning: "입체 구조를 층과 면으로 나누어 필요한 공간과 재료를 계산합니다.",
    };
  }
  if (includesAny(text, ["그래프", "표", "자료", "평균", "가능성", "확률"])) {
    return {
      formula: "평균 = 자료의 합 ÷ 자료 수,  변화량 = 나중 값 - 처음 값",
      meaning: "자료를 표와 그래프로 바꾸어 경향과 의사결정 기준을 찾습니다.",
    };
  }
  if (includesAny(text, ["규칙", "대응", "식", "방정식", "함수", "패턴"])) {
    return {
      formula: "입력 x → 규칙 → 출력 y,  y = ax + b",
      meaning: "반복되는 관계를 식과 알고리즘으로 표현해 다음 값을 예측합니다.",
    };
  }
  if (includesAny(text, ["약수", "배수", "공약수", "공배수", "최대공약수", "최소공배수"])) {
    return {
      formula: "공약수 = 함께 나누는 수,  공배수 = 함께 도착하는 배수",
      meaning: "반복 주기와 나눔 구조를 찾아 일정과 자원을 효율적으로 맞춥니다.",
    };
  }
  if (includesAny(text, ["소수", "자릿값"])) {
    return {
      formula: "소수 계산 = 자연수 계산 후 소수점 위치 조정",
      meaning: "작은 단위를 정밀하게 재고 계산해 실제 측정값을 다룹니다.",
    };
  }
  return {
    formula: "전체 = 부분 + 부분,  남은 수 = 전체 - 사용한 수",
    meaning: "상황을 부분과 전체로 나누어 필요한 수를 차근차근 찾습니다.",
  };
}

function stemFocusFor(unit: Unit) {
  const text = `${unit.title} ${unit.subtitle} ${unit.topics.map((topic) => topic.title).join(" ")}`;
  const focus = new Set<string>(["수학 모델링", "데이터 읽기"]);
  if (includesAny(text, ["표", "그래프", "자료", "평균", "가능성"])) focus.add("데이터 시각화");
  if (includesAny(text, ["도형", "넓이", "부피", "각도", "입체", "쌓기"])) focus.add("공학 설계");
  if (includesAny(text, ["규칙", "패턴", "대응", "식", "방정식"])) focus.add("컴퓨팅 사고");
  if (includesAny(text, ["길이", "무게", "들이", "시간", "시각", "측정"])) focus.add("과학적 측정");
  if (includesAny(text, ["비", "비율", "백분율", "소수", "분수"])) focus.add("정량 추론");
  return [...focus].slice(0, 4);
}

function areaCount(topics: Topic[], area: LearningArea) {
  return topics.filter((topic) => (topic.learningArea ?? "basic") === area).length;
}

function topicMissionFor(unit: Unit, topic: Topic, index: number, formula: string): StemStoryTopicMission {
  const area = topic.learningArea ?? "basic";
  const stemSkill = AREA_LABELS[area];
  return {
    topicId: topic.id,
    title: `${index + 1}. ${topic.title}`,
    narrative: `${topic.desc} 미션을 해결하며 ${unitLabelText(unit)} 이야기 속 문제를 데이터, 도구, 식으로 바꿉니다.`,
    stemSkill,
    formula,
    dataPrompt: `${topic.title} 결과를 표에 적고, 맞힌 수와 다시 볼 수를 막대그래프로 비교합니다.`,
  };
}

export function buildStemStoryChapters(units: Unit[]): StemStoryChapter[] {
  return units.map((unit) => {
    const gradeNo = gradeNumberOf(unit);
    const world = STORY_WORLDS[gradeNo] ?? STORY_WORLDS[5]!;
    const label = unitLabelText(unit);
    const profile = formulaProfile(unit);
    const stemFocus = stemFocusFor(unit);
    const chartItems = (Object.keys(AREA_LABELS) as LearningArea[]).map((area) => ({
      label: AREA_LABELS[area].replace(" ", "\n"),
      value: areaCount(unit.topics, area),
    }));
    const linePoints = unit.topics.slice(0, 6).map((topic, index) => ({
      label: `${index + 1}`,
      value: Math.max(1, (topic.desc.length % 7) + index + 2),
    }));
    return {
      unitId: unit.id,
      unitNo: unit.no,
      unitLabel: label,
      course: unit.course ?? `${gradeNo}학년`,
      month: unit.month ?? `${unit.no}단원`,
      title: `${label} ${world.world}`,
      scene: `${world.role}가 ${unit.title}을 활용해 실제 문제를 해결하는 STEM 스토리입니다.`,
      teaser: `${unit.subtitle}를 이야기, 도표, 그래프, 수식으로 연결합니다.`,
      narrative: `${world.goal} 이번 단원에서는 ${unit.title} 내용을 ${stemFocus.join(", ")} 관점으로 살펴보고, 목차별 미션을 해결하며 자기만의 설명 모델을 완성합니다.`,
      stemFocus,
      engineeringChallenge: `${unit.title} 개념으로 학교나 가정에서 쓸 수 있는 작은 해결책을 설계하고, 조건·자료·식·검증 결과를 한 장의 설계 기록으로 정리합니다.`,
      dataQuestion: `${label} 미션에서 어떤 유형이 가장 많이 등장하는지 세고, 풀이 결과가 다음 선택을 어떻게 바꾸는지 설명합니다.`,
      formula: profile.formula,
      formulaMeaning: profile.meaning,
      chartTitle: "목차별 STEM 역량 분포",
      chartItems,
      lineTitle: "탐구 난이도 흐름",
      linePoints: linePoints.length ? linePoints : [{ label: "1", value: 1 }],
      topicMissions: unit.topics.map((topic, index) => topicMissionFor(unit, topic, index, profile.formula)),
      visualKind: world.visualKind,
      icon: world.icon,
    };
  });
}

const STORIES: Record<string, StoryInfo> = {
  addsub: {
    chapter: "별빛 시장",
    scene: "상점의 반짝이 구슬 수를 맞춰야 합니다.",
    narration: "덧셈과 뺄셈은 왼쪽에서 오른쪽으로 차례대로 계산하면 길이 열립니다.",
    guide: "같은 단계의 연산은 앞에서부터 순서대로 처리하세요.",
    reward: "계산 나침반",
    icon: "✦",
  },
  "addsub-paren": {
    chapter: "별빛 시장",
    scene: "괄호 상자 안의 물건을 먼저 정리해야 합니다.",
    narration: "상자 안을 먼저 계산하면 나머지 계산이 훨씬 쉬워집니다.",
    guide: "괄호 안을 먼저 계산한 뒤 바깥 식을 계산하세요.",
    reward: "괄호 열쇠",
    icon: "✦",
  },
  muldiv: {
    chapter: "별빛 시장",
    scene: "마법 저울이 곱셈과 나눗셈 순서를 기다립니다.",
    narration: "곱셈과 나눗셈만 있을 때에는 앞에서부터 차례대로 계산합니다.",
    guide: "왼쪽부터 한 단계씩 계산 결과를 이어 가세요.",
    reward: "곱셈 저울",
    icon: "✦",
  },
  "muldiv-paren": {
    chapter: "별빛 시장",
    scene: "마법 항아리 안의 묶음을 먼저 세어야 합니다.",
    narration: "괄호 속 곱셈이나 나눗셈을 먼저 풀면 항아리의 숫자가 정리됩니다.",
    guide: "괄호 안 계산 → 바깥 계산 순서로 진행하세요.",
    reward: "묶음 항아리",
    icon: "✦",
  },
  "four-mix-basic": {
    chapter: "별빛 시장",
    scene: "여러 주문이 한 줄에 섞여 있습니다.",
    narration: "곱셈과 나눗셈 주문을 먼저 처리한 뒤 덧셈과 뺄셈으로 마무리합니다.",
    guide: "곱셈·나눗셈 먼저, 그다음 덧셈·뺄셈입니다.",
    reward: "사칙 주문서",
    icon: "✦",
  },
  "four-mix-paren": {
    chapter: "별빛 시장",
    scene: "가장 오래된 계산 주문서가 펼쳐졌습니다.",
    narration: "괄호가 있으면 괄호부터, 그다음 곱셈·나눗셈, 마지막으로 덧셈·뺄셈입니다.",
    guide: "괄호 → 곱셈·나눗셈 → 덧셈·뺄셈 순서입니다.",
    reward: "순서의 왕관",
    icon: "✦",
  },
  "missing-operator-choice": {
    chapter: "별빛 시장",
    scene: "사라진 연산 기호를 찾아 주문을 완성해야 합니다.",
    narration: "각 기호를 넣어 결과가 맞는지 비교하면 정답 기호를 찾을 수 있습니다.",
    guide: "보기의 연산 기호를 하나씩 넣어 계산해 보세요.",
    reward: "기호 브로치",
    icon: "✦",
  },
  "reverse-mixed": {
    chapter: "별빛 시장",
    scene: "마법 상자에 숨은 수를 거꾸로 찾아야 합니다.",
    narration: "마지막에 한 계산부터 반대로 되돌리면 숨은 수가 나옵니다.",
    guide: "더했으면 빼고, 곱했으면 나누며 거꾸로 계산하세요.",
    reward: "되감기 모래시계",
    icon: "✦",
  },

  factors: {
    chapter: "숲속 열쇠",
    scene: "숲의 문은 나누어떨어지는 열쇠만 받아들입니다.",
    narration: "어떤 수를 나누어떨어지게 하는 수들이 약수입니다.",
    guide: "1부터 차례대로 나누어떨어지는 수를 찾으세요.",
    reward: "약수 열쇠",
    icon: "◆",
  },
  multiples: {
    chapter: "배수 다리",
    scene: "같은 간격의 발판을 밟아 강을 건너갑니다.",
    narration: "어떤 수를 1배, 2배, 3배 한 수가 배수입니다.",
    guide: "주어진 수에 1, 2, 3, 4, 5를 곱하세요.",
    reward: "배수 발판",
    icon: "◆",
  },
  "factor-count": {
    chapter: "숲속 열쇠",
    scene: "열쇠가 모두 몇 개인지 세어야 상자가 열립니다.",
    narration: "약수를 빠뜨리지 않고 찾은 뒤 개수를 세면 됩니다.",
    guide: "작은 약수와 짝이 되는 큰 약수를 함께 확인하세요.",
    reward: "열쇠 꾸러미",
    icon: "◆",
  },
  "factor-multiple-choice": {
    chapter: "숲속 열쇠",
    scene: "문지기가 약수와 배수의 관계를 묻습니다.",
    narration: "한 수가 다른 수를 나누어떨어지게 하면 약수와 배수 관계입니다.",
    guide: "큰 수가 작은 수로 나누어떨어지는지 확인하세요.",
    reward: "관계 표지판",
    icon: "◆",
  },
  "common-factors": {
    chapter: "숲속 열쇠",
    scene: "두 문을 동시에 여는 공통 열쇠를 찾아야 합니다.",
    narration: "두 수에 모두 들어맞는 약수가 공약수입니다.",
    guide: "최대공약수의 약수를 찾으면 공약수를 빠르게 찾을 수 있습니다.",
    reward: "공통 열쇠",
    icon: "◆",
  },
  "common-multiples": {
    chapter: "배수 다리",
    scene: "두 발판 길이 동시에 만나는 지점을 찾아야 합니다.",
    narration: "두 수의 공통 배수는 최소공배수의 배수입니다.",
    guide: "최소공배수를 먼저 찾고 그 배수를 이어 쓰세요.",
    reward: "만남의 발판",
    icon: "◆",
  },
  gcd: {
    chapter: "숲속 열쇠",
    scene: "가장 큰 공통 열쇠가 보물문을 엽니다.",
    narration: "공약수 중에서 가장 큰 수가 최대공약수입니다.",
    guide: "두 수를 모두 나누는 가장 큰 수를 찾으세요.",
    reward: "큰 열쇠",
    icon: "◆",
  },
  lcm: {
    chapter: "배수 다리",
    scene: "가장 가까운 만남의 발판을 찾아야 합니다.",
    narration: "공배수 중에서 가장 작은 수가 최소공배수입니다.",
    guide: "두 수가 처음으로 함께 도착하는 배수를 찾으세요.",
    reward: "첫 만남 표식",
    icon: "◆",
  },
  "gcd-word": {
    chapter: "숲속 열쇠",
    scene: "물건을 똑같이 나누어 담아 축제를 준비합니다.",
    narration: "남김없이 똑같이 나눌 때에는 최대공약수를 사용합니다.",
    guide: "두 물건 수의 최대공약수를 구하세요.",
    reward: "축제 바구니",
    icon: "◆",
  },
  "lcm-word": {
    chapter: "배수 다리",
    scene: "두 행렬이 다시 만나는 시간을 찾아야 합니다.",
    narration: "같은 일이 다시 동시에 일어나는 시간은 최소공배수로 찾습니다.",
    guide: "두 간격의 최소공배수를 구하세요.",
    reward: "시간 종",
    icon: "◆",
  },

  "rate-value": {
    chapter: "무지개 마을",
    scene: "하나가 늘 때 함께 늘어나는 양을 찾아 다리를 놓습니다.",
    narration: "몇 배 관계인지 알면 먼 곳의 값도 바로 구할 수 있습니다.",
    guide: "한쪽 값에 일정한 수를 곱하거나 나누세요.",
    reward: "무지개 조각",
    icon: "◇",
  },
  "offset-value": {
    chapter: "무지개 마을",
    scene: "항상 일정하게 더 많은 수를 찾아야 합니다.",
    narration: "두 양의 차가 일정하면 더하기와 빼기로 값을 찾을 수 있습니다.",
    guide: "항상 더해지는 수나 빼지는 수를 확인하세요.",
    reward: "차이 리본",
    icon: "◇",
  },
  "table-missing": {
    chapter: "무지개 마을",
    scene: "비어 있는 표 칸에 다리 돌을 채워야 합니다.",
    narration: "표를 가로로 읽으면 두 양의 변화 규칙이 보입니다.",
    guide: "위아래 숫자 사이의 규칙을 먼저 찾으세요.",
    reward: "표 지도",
    icon: "◇",
  },
  "rate-table-reverse": {
    chapter: "무지개 마을",
    scene: "완성된 결과에서 처음 값을 거꾸로 찾아야 합니다.",
    narration: "배 관계는 곱하기로 가고, 나누기로 되돌아옵니다.",
    guide: "결과값을 배수로 나누어 처음 값을 찾으세요.",
    reward: "되돌림 다리",
    icon: "◇",
  },
  "formula-choice": {
    chapter: "무지개 마을",
    scene: "마을의 규칙을 짧은 식으로 적어야 합니다.",
    narration: "기호를 쓰면 긴 대응 관계를 간단히 표현할 수 있습니다.",
    guide: "두 기호 중 어느 쪽이 몇 배 또는 몇만큼 다른지 보세요.",
    reward: "기호 깃발",
    icon: "◇",
  },
  "formula-missing-number": {
    chapter: "무지개 마을",
    scene: "대응식에서 빠진 숫자가 무지개 색을 되찾습니다.",
    narration: "식의 빈칸에는 두 양을 이어 주는 일정한 수가 들어갑니다.",
    guide: "배수인지 차이인지 먼저 구분하세요.",
    reward: "빈칸 수정구",
    icon: "◇",
  },
  "relation-sentence-choice": {
    chapter: "무지개 마을",
    scene: "마을 사람들이 규칙을 말로 설명해 달라고 합니다.",
    narration: "표현은 달라도 두 양의 관계가 정확해야 합니다.",
    guide: "항상 몇 배인지, 항상 몇만큼 다른지 확인하세요.",
    reward: "설명 두루마리",
    icon: "◇",
  },
  "pattern-bridge": {
    chapter: "무지개 마을",
    scene: "도형 발판이 규칙대로 이어져야 다리가 완성됩니다.",
    narration: "배열이 늘어나는 만큼 함께 늘어나는 수를 찾습니다.",
    guide: "한 묶음에 들어 있는 조각 수를 찾으세요.",
    reward: "도형 발판",
    icon: "◇",
  },
  "two-step-relation": {
    chapter: "무지개 마을",
    scene: "기본값이 있는 마을 장부를 계산해야 합니다.",
    narration: "처음부터 있는 수와 반복해서 늘어나는 수를 나누어 생각합니다.",
    guide: "기본값을 먼저 확인하고, 나머지는 곱셈으로 계산하세요.",
    reward: "장부 펜",
    icon: "◇",
  },
  "table-row-choice": {
    chapter: "무지개 마을",
    scene: "표 한 줄을 맞게 채워 무지개 길을 완성합니다.",
    narration: "연속된 값도 같은 규칙으로 차례대로 만들 수 있습니다.",
    guide: "1, 2, 3, 4, 5일 때의 값을 순서대로 계산하세요.",
    reward: "완성 표식",
    icon: "◇",
  },

  "equivalent-fraction": {
    chapter: "달빛 분수 정원",
    scene: "같은 크기의 분수 조각을 찾아 분수대를 맞춥니다.",
    narration: "분모와 분자에 같은 수를 곱하면 크기가 같은 분수가 됩니다.",
    guide: "분모가 어떻게 바뀌었는지 보고 분자도 같은 수를 곱하세요.",
    reward: "달빛 조각",
    icon: "☾",
  },
  "equivalent-fraction-choice": {
    chapter: "달빛 분수 정원",
    scene: "보기 중 진짜 같은 크기 조각을 골라야 합니다.",
    narration: "분모와 분자가 같은 비율로 커진 분수를 찾으면 됩니다.",
    guide: "분모와 분자에 같은 수를 곱했는지 확인하세요.",
    reward: "같은 크기 렌즈",
    icon: "☾",
  },
  "missing-multiplier": {
    chapter: "달빛 분수 정원",
    scene: "분수 조각이 몇 배 커졌는지 밝혀야 합니다.",
    narration: "분모와 분자가 똑같이 몇 배 되었는지 찾습니다.",
    guide: "새 분모를 원래 분모로 나누어 보세요.",
    reward: "배율 돋보기",
    icon: "☾",
  },
  "reduce-fraction": {
    chapter: "달빛 분수 정원",
    scene: "분수 조각을 가장 단정한 모양으로 다듬습니다.",
    narration: "분모와 분자를 공약수로 나누면 더 간단한 분수가 됩니다.",
    guide: "가장 큰 공약수로 나누면 한 번에 기약분수가 됩니다.",
    reward: "기약 조각칼",
    icon: "☾",
  },
  "reduce-by-given-divisor": {
    chapter: "달빛 분수 정원",
    scene: "정해진 도구로 분수 조각을 한 번 다듬습니다.",
    narration: "주어진 수로 분모와 분자를 각각 나누어 약분합니다.",
    guide: "분모와 분자를 같은 수로 나누세요.",
    reward: "약분 망치",
    icon: "☾",
  },
  "all-reductions-choice": {
    chapter: "달빛 분수 정원",
    scene: "가능한 약분 조각을 모두 골라 전시해야 합니다.",
    narration: "1이 아닌 공약수로 나누면 여러 약분 결과가 나옵니다.",
    guide: "분모와 분자의 공약수를 모두 확인하세요.",
    reward: "전시 진열대",
    icon: "☾",
  },
  "common-denominator-product": {
    chapter: "달빛 분수 정원",
    scene: "두 조각을 같은 눈금판에 올려야 합니다.",
    narration: "두 분모의 곱을 공통분모로 삼으면 두 분수를 통분할 수 있습니다.",
    guide: "각 분모가 공통분모가 되려면 몇 배 필요한지 찾으세요.",
    reward: "큰 눈금판",
    icon: "☾",
  },
  "common-denominator-lcm": {
    chapter: "달빛 분수 정원",
    scene: "가장 작은 눈금판으로 두 조각을 비교합니다.",
    narration: "두 분모의 최소공배수를 공통분모로 하면 수가 작아집니다.",
    guide: "두 분모의 최소공배수를 먼저 구하세요.",
    reward: "작은 눈금판",
    icon: "☾",
  },
  "common-denominator-missing-numerator": {
    chapter: "달빛 분수 정원",
    scene: "통분된 조각의 빠진 분자를 채워야 합니다.",
    narration: "분모를 공통분모로 바꾼 배수만큼 분자도 곱합니다.",
    guide: "분모가 몇 배 되었는지 먼저 확인하세요.",
    reward: "분자 별",
    icon: "☾",
  },
  "compare-fractions": {
    chapter: "달빛 분수 정원",
    scene: "두 조각 중 어느 쪽이 더 큰지 달빛 저울에 올립니다.",
    narration: "분모가 다르면 통분해서 분자를 비교합니다.",
    guide: "공통분모로 고친 뒤 분자 크기를 비교하세요.",
    reward: "달빛 저울",
    icon: "☾",
  },
  "compare-reduced-fractions": {
    chapter: "달빛 분수 정원",
    scene: "복잡한 조각을 간단히 다듬고 비교합니다.",
    narration: "약분하면 두 분수의 크기를 더 쉽게 비교할 수 있습니다.",
    guide: "먼저 기약분수로 고친 뒤 비교하세요.",
    reward: "비교 망원경",
    icon: "☾",
  },
  "order-three-fractions": {
    chapter: "달빛 분수 정원",
    scene: "세 조각을 작은 것부터 전시대에 올립니다.",
    narration: "세 분수도 값이 작고 큰 순서대로 놓으면 됩니다.",
    guide: "통분하거나 소수로 생각해서 순서를 정하세요.",
    reward: "정렬 리본",
    icon: "☾",
  },
  "fraction-decimal-convert-choice": {
    chapter: "달빛 분수 정원",
    scene: "분수 조각을 소수 표지판으로 바꿉니다.",
    narration: "분모를 10, 100처럼 만들면 소수로 바꾸기 쉽습니다.",
    guide: "분모를 10이나 100으로 바꿀 수 있는지 확인하세요.",
    reward: "소수 표지판",
    icon: "☾",
  },
  "fraction-decimal-compare": {
    chapter: "달빛 분수 정원",
    scene: "분수와 소수가 같은 저울 위에 올라왔습니다.",
    narration: "분수를 소수로 바꾸거나 소수를 분수로 바꾸면 비교할 수 있습니다.",
    guide: "한 가지 표현으로 통일한 뒤 크기를 비교하세요.",
    reward: "변신 저울",
    icon: "☾",
  },

  "proper-fraction-add-under-one": {
    chapter: "구름 제과점",
    scene: "작은 분수 재료를 섞어 한 그릇보다 적은 반죽을 만듭니다.",
    narration: "분모가 다른 진분수는 통분한 뒤 분자끼리 더합니다.",
    guide: "두 분모의 최소공배수로 통분하고 합이 1보다 작은지 확인하세요.",
    reward: "작은 반죽 그릇",
    icon: "✧",
  },
  "proper-fraction-add-over-one": {
    chapter: "구름 제과점",
    scene: "분수 재료가 한 그릇을 넘어 대분수 반죽이 됩니다.",
    narration: "합이 1보다 크면 가분수를 대분수로 바꾸어 나타냅니다.",
    guide: "통분해 더한 뒤 분자가 분모보다 크면 대분수로 고치세요.",
    reward: "넘치는 계량컵",
    icon: "✧",
  },
  "mixed-fraction-add": {
    chapter: "구름 제과점",
    scene: "대분수 레시피 두 장을 합쳐 큰 반죽을 만듭니다.",
    narration: "자연수 부분과 분수 부분을 함께 생각하면 계산이 정리됩니다.",
    guide: "분수 부분을 통분해 더하고 필요하면 자연수로 올림하세요.",
    reward: "레시피 저울",
    icon: "✧",
  },
  "proper-fraction-sub": {
    chapter: "구름 제과점",
    scene: "쓴 재료만큼 덜어 내고 남은 양을 구합니다.",
    narration: "분모가 다른 진분수의 뺄셈도 통분 후 분자끼리 뺍니다.",
    guide: "큰 분수에서 작은 분수를 빼도록 먼저 크기를 확인하세요.",
    reward: "덜어내기 숟가락",
    icon: "✧",
  },
  "mixed-fraction-sub-no-borrow": {
    chapter: "구름 제과점",
    scene: "분수 부분을 바로 덜어 낼 수 있는 레시피입니다.",
    narration: "분수 부분끼리 뺄 수 있으면 자연수 부분과 분수 부분을 차례로 계산합니다.",
    guide: "분수 부분을 통분한 뒤 바로 뺄 수 있는지 확인하세요.",
    reward: "깔끔한 계량 스푼",
    icon: "✧",
  },
  "mixed-fraction-sub-borrow": {
    chapter: "구름 제과점",
    scene: "재료가 부족해 자연수 한 그릇을 분수로 나누어 빌려옵니다.",
    narration: "분수 부분끼리 뺄 수 없으면 자연수 1을 분수로 바꾸어 받아내림합니다.",
    guide: "공통분모에 맞춰 자연수 1을 분수로 바꾼 뒤 빼세요.",
    reward: "받아내림 주걱",
    icon: "✧",
  },
  "missing-fraction-addend": {
    chapter: "구름 제과점",
    scene: "레시피에서 사라진 분수 재료를 찾아야 합니다.",
    narration: "덧셈식의 빈칸은 전체 합에서 알고 있는 분수를 빼면 찾을 수 있습니다.",
    guide: "합 - 주어진 분수 순서로 계산하세요.",
    reward: "빈칸 계량표",
    icon: "✧",
  },
  "missing-fraction-subtrahend": {
    chapter: "구름 제과점",
    scene: "얼마만큼 덜어 냈는지 레시피 기록을 복원합니다.",
    narration: "뺄셈식의 빈칸은 처음 양에서 남은 양을 빼면 찾을 수 있습니다.",
    guide: "처음 수 - 결과값으로 빈칸을 구하세요.",
    reward: "복원 노트",
    icon: "✧",
  },
  "fraction-card-sum": {
    chapter: "구름 제과점",
    scene: "수 카드로 가장 큰 레시피와 가장 작은 레시피를 만들어 합칩니다.",
    narration: "대분수는 자연수 부분이 클수록 커지고, 자연수 부분이 작을수록 작아집니다.",
    guide: "가장 큰 수를 자연수 부분으로, 가장 작은 수를 자연수 부분으로 각각 만들어 보세요.",
    reward: "수 카드 쟁반",
    icon: "✧",
  },
  "fraction-card-difference": {
    chapter: "구름 제과점",
    scene: "두 수 카드 레시피의 차이를 구해 비밀 재료 양을 찾습니다.",
    narration: "가장 큰 대분수에서 가장 작은 대분수를 빼면 차이를 구할 수 있습니다.",
    guide: "두 대분수를 만든 뒤 대분수 뺄셈으로 계산하세요.",
    reward: "비밀 재료 병",
    icon: "✧",
  },
};

const PREFIX_STORIES: Array<[string, StoryInfo]> = [
  [
    "rectangle-",
    {
      chapter: "황금 들판",
      scene: "도형 마을의 울타리와 밭 넓이를 재야 합니다.",
      narration: "가로, 세로, 밑변, 높이를 정확히 읽으면 공식이 바로 보입니다.",
      guide: "둘레는 길이를 더하고, 넓이는 필요한 길이를 곱해 계산하세요.",
      reward: "넓이 지도",
      icon: "▣",
    },
  ],
  [
    "square-",
    {
      chapter: "황금 들판",
      scene: "네 변이 같은 작은 밭의 둘레를 확인합니다.",
      narration: "정사각형은 네 변의 길이가 모두 같다는 점을 이용합니다.",
      guide: "한 변을 네 번 더하거나 4를 곱하세요.",
      reward: "정사각 울타리",
      icon: "▣",
    },
  ],
  [
    "parallelogram-",
    {
      chapter: "황금 들판",
      scene: "기울어진 밭을 곧게 옮겨 넓이를 구합니다.",
      narration: "평행사변형은 밑변과 높이가 넓이를 결정합니다.",
      guide: "비스듬한 변이 아니라 높이를 사용하세요.",
      reward: "높이 자",
      icon: "▣",
    },
  ],
  [
    "triangle-",
    {
      chapter: "황금 들판",
      scene: "삼각형 밭 두 개를 붙여 평행사변형처럼 생각합니다.",
      narration: "삼각형은 같은 밑변과 높이의 평행사변형 넓이의 절반입니다.",
      guide: "밑변 × 높이 ÷ 2로 계산하세요.",
      reward: "반쪽 밭 지도",
      icon: "▣",
    },
  ],
  [
    "trapezoid-",
    {
      chapter: "황금 들판",
      scene: "윗변과 아랫변이 다른 밭의 넓이를 재야 합니다.",
      narration: "사다리꼴은 두 밑변의 합과 높이를 함께 사용합니다.",
      guide: "(윗변 + 아랫변) × 높이 ÷ 2 순서로 계산하세요.",
      reward: "사다리 지도",
      icon: "▣",
    },
  ],
  [
    "range-",
    {
      chapter: "어림 시계탑",
      scene: "범위 문이 기준 수를 포함하는지 묻고 있습니다.",
      narration: "이상과 이하는 기준 수를 포함하고, 초과와 미만은 포함하지 않습니다.",
      guide: "기준 수가 들어가는 표현인지 먼저 확인하세요.",
      reward: "범위 열쇠",
      icon: "⌁",
    },
  ],
  [
    "round-",
    {
      chapter: "어림 시계탑",
      scene: "시계탑 숫자를 알맞은 자리까지 반올림합니다.",
      narration: "반올림할 자리 바로 아래 숫자를 보고 올릴지 버릴지 결정합니다.",
      guide: "5 이상이면 올리고, 4 이하이면 버리세요.",
      reward: "반올림 시계",
      icon: "⌁",
    },
  ],
  [
    "fraction-times",
    {
      chapter: "분수 별농장",
      scene: "분수 씨앗을 여러 배로 늘려 별빛 밭을 채웁니다.",
      narration: "분수 곱셈은 분자와 분모가 어떻게 바뀌는지 차분히 보면 됩니다.",
      guide: "곱한 뒤 약분할 수 있으면 가장 간단히 나타내세요.",
      reward: "곱셈 씨앗",
      icon: "✶",
    },
  ],
  [
    "integer-times-fraction",
    {
      chapter: "분수 별농장",
      scene: "같은 분수 씨앗을 여러 줄 심습니다.",
      narration: "자연수와 분수의 곱은 같은 분수를 여러 번 더한 값입니다.",
      guide: "자연수를 분자에 곱해 계산하세요.",
      reward: "별밭 줄자",
      icon: "✶",
    },
  ],
  [
    "congruent-",
    {
      chapter: "거울 성",
      scene: "서로 포개지는 두 도형의 같은 자리를 찾아야 합니다.",
      narration: "합동인 도형은 대응변의 길이와 대응각의 크기가 같습니다.",
      guide: "도형 이름의 순서대로 대응하는 점을 맞추세요.",
      reward: "합동 거울",
      icon: "◇",
    },
  ],
  [
    "symmetry-",
    {
      chapter: "거울 성",
      scene: "대칭선을 사이에 두고 점의 위치가 바뀝니다.",
      narration: "대칭에서는 기준선까지의 거리가 같고 방향만 반대로 바뀝니다.",
      guide: "가로 대칭인지 세로 대칭인지 먼저 보세요.",
      reward: "대칭 나침반",
      icon: "◇",
    },
  ],
  [
    "decimal-",
    {
      chapter: "소수 항구",
      scene: "소수 길이의 상자를 정확한 칸에 싣습니다.",
      narration: "소수 곱셈은 자연수처럼 곱한 뒤 소수점 위치를 맞춥니다.",
      guide: "소수점 아래 자리 수를 세고 마지막에 점을 찍으세요.",
      reward: "소수 항해도",
      icon: "✺",
    },
  ],
  [
    "cuboid-",
    {
      chapter: "입체 상자 창고",
      scene: "직육면체 상자의 면과 모서리를 정리합니다.",
      narration: "직육면체는 마주 보는 면과 같은 길이의 모서리가 짝을 이룹니다.",
      guide: "같은 길이끼리 묶어 세면 빠뜨리지 않습니다.",
      reward: "입체 상자",
      icon: "▤",
    },
  ],
  [
    "average-",
    {
      chapter: "평균 무대",
      scene: "여러 점수를 고르게 나누어 대표값을 찾습니다.",
      narration: "평균은 전체 합을 자료 수로 똑같이 나눈 값입니다.",
      guide: "합, 자료 수, 평균 중 무엇을 묻는지 먼저 확인하세요.",
      reward: "평균 왕관",
      icon: "✹",
    },
  ],
  [
    "chance-",
    {
      chapter: "가능성 축제",
      scene: "어떤 일이 더 잘 일어날지 축제 표지판을 고릅니다.",
      narration: "가능성은 일어날 수 있는 경우와 개수를 비교해 판단합니다.",
      guide: "개수가 많을수록 뽑힐 가능성이 커집니다.",
      reward: "가능성 깃발",
      icon: "✹",
    },
  ],
  [
    "review-",
    {
      chapter: "별빛 기록관",
      scene: "5학년 동안 모은 수학 기록을 다시 펼쳐 봅니다.",
      narration: "이미 배운 규칙을 떠올리면 복합 문제도 차례대로 해결할 수 있습니다.",
      guide: "어떤 단원의 규칙을 쓰는 문제인지 먼저 분류하세요.",
      reward: "총정리 배지",
      icon: "★",
    },
  ],
  [
    "prep-",
    {
      chapter: "새 학년 관문",
      scene: "6학년으로 가는 문 앞에서 새 개념을 가볍게 미리 봅니다.",
      narration: "낯선 문제도 5학년에서 배운 나눗셈, 비, 그래프 읽기와 연결됩니다.",
      guide: "새 공식보다 상황을 먼저 읽고 한 단계씩 계산하세요.",
      reward: "준비 별",
      icon: "✚",
    },
  ],
];

const FALLBACK: StoryInfo = {
  chapter: "수학 이야기",
  scene: "새로운 수학 미션이 도착했습니다.",
  narration: "문제를 읽고 필요한 규칙을 찾아 차근차근 해결해 봅니다.",
  guide: "조건을 먼저 확인하고 계산 순서를 지키세요.",
  reward: "별 조각",
  icon: "★",
};

export function storyForTopic(topicId: string): StoryInfo {
  return STORIES[topicId] ?? PREFIX_STORIES.find(([prefix]) => topicId.startsWith(prefix))?.[1] ?? FALLBACK;
}
