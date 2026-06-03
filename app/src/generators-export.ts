// 초등 연산 문제 생성기를 window 전역으로 노출하는 번들 엔트리포인트

import { GENERATORS } from "./lib/generators";
import { UNITS } from "./lib/curriculum";

// 연산 토픽만 필터링해 학년/학기별로 구조화
function buildOpCurriculum() {
  const result: Record<string, Record<string, Array<{
    id: string; title: string; desc: string; generate: () => unknown
  }>>> = {};

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

    for (const topic of unit.topics) {
      if (!topic.id.startsWith(`g${grade}-op-`)) continue;
      if (typeof topic.generate !== "function") continue;
      result[grade][semester].push({
        id: topic.id,
        title: topic.title,
        desc: topic.desc ?? "",
        generate: topic.generate as () => unknown,
      });
    }
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
