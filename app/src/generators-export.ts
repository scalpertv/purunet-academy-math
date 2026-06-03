// 초등 연산 문제 생성기를 window 전역으로 노출하는 번들 엔트리포인트

import { GENERATORS } from "./lib/generators";
import { UNITS } from "./lib/curriculum";

// 단원 그룹핑된 OP_CURRICULUM 구조
// { grade: { semester: [ { unitId, unitTitle, unitLabel, topics[] } ] } }
function buildOpCurriculum() {
  type Topic = { id: string; title: string; desc: string; learningArea: string; generate: () => unknown };
  type UnitGroup = { unitId: string; unitTitle: string; unitLabel: string; topics: Topic[] };
  const result: Record<string, Record<string, UnitGroup[]>> = {};

  for (const unit of UNITS) {
    const gradeMatch = /^(\d)학년/.exec(unit.course);
    if (!gradeMatch) continue;
    const grade = gradeMatch[1]!;

    const monthStr: string = unit.month ?? "0";
    const monthNum = parseInt(monthStr, 10);
    if (!monthNum) continue;
    // 1학기: 3~8월, 2학기: 9~12월+1~2월
    const semester = monthNum >= 3 && monthNum <= 8 ? "1" : "2";

    if (!result[grade]) result[grade] = {};
    if (!result[grade][semester]) result[grade][semester] = [];

    // 이 unit의 연산 토픽만 추출
    const opTopics: Topic[] = [];
    for (const topic of unit.topics) {
      if (!topic.id.startsWith(`g${grade}-op-`)) continue;
      if (typeof topic.generate !== "function") continue;
      opTopics.push({
        id: topic.id,
        title: topic.title,
        desc: topic.desc ?? "",
        learningArea: (topic as { learningArea?: string }).learningArea ?? "basic",
        generate: topic.generate as () => unknown,
      });
    }

    if (opTopics.length === 0) continue; // 연산 토픽 없는 단원 제외

    result[grade][semester].push({
      unitId: unit.id,
      unitTitle: unit.title,
      unitLabel: unit.label,
      topics: opTopics,
    });
  }

  return result;
}

const OP_CURRICULUM = buildOpCurriculum();

declare global {
  interface Window {
    PurunetGenerators: {
      GENERATORS: typeof GENERATORS;
      OP_CURRICULUM: typeof OP_CURRICULUM;
    };
  }
}

window.PurunetGenerators = { GENERATORS, OP_CURRICULUM };
