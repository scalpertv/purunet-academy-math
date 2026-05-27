// 푸르넷 수학과 푸르넷 영어 학습 데이터를 한 앱에서 쓰도록 통합 생성하는 데이터 모듈
(function () {
  'use strict';

  const months = [
    ['3월', '새 학기 진단과 기본 개념 정리'],
    ['4월', '기초 개념 확장과 유형 적응'],
    ['5월', '핵심 원리 확인과 짧은 응용'],
    ['6월', '그림 자료와 표를 활용한 문제 해결'],
    ['7월', '여름 복습과 빠른 연산 루틴'],
    ['8월', '중간 점검과 오답 패턴 교정'],
    ['9월', '2학기 핵심 개념 진입'],
    ['10월', '단원별 대표 유형 집중'],
    ['11월', '서술형 사고와 심화 문제'],
    ['12월', '학기말 종합 복습'],
    ['1월', '다음 학년 예습 연결'],
    ['2월', '입학·진급 준비 최종 점검']
  ];

  const mathConceptThemes = [
    ['수와 자리값', '수 모형을 보고 읽고 쓰며 크기를 비교합니다.', '🔢'],
    ['도형과 공간', '평면도형과 입체도형을 관찰하고 성질을 찾습니다.', '🧊'],
    ['측정과 시간', '길이, 들이, 무게, 시간 자료를 읽고 비교합니다.', '⏱️'],
    ['자료와 규칙', '표, 그래프, 규칙을 읽고 다음 값을 예측합니다.', '📊'],
    ['분수와 소수', '분수와 소수를 그림과 수직선으로 연결합니다.', '🍕'],
    ['비와 비례', '비율, 백분율, 비례식을 생활 문제로 이해합니다.', '⚖️']
  ];

  const operationThemes = [
    ['덧셈·뺄셈 정확도', '받아올림과 받아내림을 단계별로 연습합니다.', '➕'],
    ['곱셈구구와 곱셈', '곱셈 의미와 곱셈표를 게임처럼 익힙니다.', '✖️'],
    ['나눗셈과 몫', '나누어 떨어지는 계산과 나머지를 확인합니다.', '➗'],
    ['혼합 계산', '괄호와 계산 순서를 지켜 정확히 계산합니다.', '🧮'],
    ['분수 연산', '통분, 약분, 분수의 덧셈과 뺄셈을 연습합니다.', '½'],
    ['소수·비율 연산', '소수 계산과 백분율 계산을 연결합니다.', '%']
  ];

  const englishTracks = [
    ['kindergarten', '유치 영어 루틴', 'Hello. I am happy.', 'I can say hello and choose a feeling card.', '😊'],
    ['karaoke', '영어 노래방', 'Hello, hello, wave your hand.', 'I can chant a short song with rhythm.', '🎤'],
    ['listening', '영어 듣기', 'Open your book and listen.', 'I can catch the key action in a classroom sentence.', '👂'],
    ['speaking', '영어 말하기', 'Hi, I am Mina. What is your name?', 'I can introduce myself and ask one question.', '💬'],
    ['phonics', '파닉스 교실', 'c-a-t, cat.', 'I can blend short vowel words.', '🔤'],
    ['reading-fluency', '영어 읽기', 'I have a small dog.', 'I can read short sentences smoothly.', '📖'],
    ['elementary-textbook', '초등 영어 교과', 'Can I sit here?', 'I can ask for permission politely.', '🏫'],
    ['elementary-vocabulary', '초등 필수 어휘', 'This is my pencil.', 'I can use classroom words in a sentence.', '✏️'],
    ['grammar-basic', '기초 문법', 'She likes music.', 'I can choose the right verb form.', '🧩'],
    ['sentence-writing', '문장 쓰기', 'I go to school by bus.', 'I can build a sentence with word cards.', '📝'],
    ['story-reading', '영어 동화', 'The rabbit finds a red hat.', 'I can read a short story and answer who, where, what.', '📚'],
    ['conversation', '생활 회화', 'May I help you?', 'I can respond in a short real-life conversation.', '🤝'],
    ['middle-vocabulary', '중등 어휘', 'The weather changes quickly.', 'I can infer a word from context.', '🌦️'],
    ['middle-grammar', '중등 문법', 'I have lived here for two years.', 'I can use tense and structure correctly.', '🧠'],
    ['exam-reading', '내신 독해', 'Read the passage and find the main idea.', 'I can identify the main idea and evidence.', '🔎'],
    ['portfolio', '영어 포트폴리오', 'My favorite place is the library.', 'I can record, revise, and present my output.', '🎒']
  ];

  function mathQuiz(grade, monthIndex, mode) {
    const base = grade * 10 + monthIndex + 4;
    if (mode === 'operation') {
      const b = (monthIndex % 5) + 3;
      const answer = grade >= 3 ? base * b : base + b + grade;
      return {
        type: 'choice',
        prompt: grade >= 3 ? `${base} × ${b}의 값은 무엇인가요?` : `${base} + ${b + grade}의 값은 무엇인가요?`,
        choices: [answer, answer + 2, Math.max(1, answer - 3), answer + grade + 5],
        answer: String(answer),
        explanation: '수를 차례대로 묶어 계산하고 마지막에 검산합니다.'
      };
    }
    const answer = grade + monthIndex + 2;
    return {
      type: 'choice',
      prompt: `${grade}학년 ${months[monthIndex][0]} 대표 개념에서 먼저 확인할 핵심 단계는 무엇인가요?`,
      choices: [
        `${answer}단계로 나누어 보기`,
        '문제만 빨리 넘기기',
        '단위를 쓰지 않기',
        '풀이 과정을 지우기'
      ],
      answer: `${answer}단계로 나누어 보기`,
      explanation: '개념 문제는 그림, 식, 말 설명을 함께 연결할수록 오래 기억됩니다.'
    };
  }

  function makeMathLesson(grade, monthIndex, mode) {
    const theme = mode === 'operation'
      ? operationThemes[(grade + monthIndex) % operationThemes.length]
      : mathConceptThemes[(grade + monthIndex) % mathConceptThemes.length];
    const month = months[monthIndex];
    const courseLabel = mode === 'operation' ? '연산' : '개념';
    return {
      id: `math-g${grade}-${mode}-${String(monthIndex + 1).padStart(2, '0')}`,
      subject: 'math',
      grade: `${grade}학년`,
      month: month[0],
      title: `${grade}학년 ${month[0]} ${courseLabel} · ${theme[0]}`,
      subtitle: month[1],
      objective: theme[1],
      canDo: `${theme[0]} 문제를 그림, 식, 말 설명으로 풀 수 있습니다.`,
      visual: theme[2],
      cards: [
        { front: `${month[0]} 핵심`, back: theme[0], visual: theme[2] },
        { front: '풀이 순서', back: '읽기 → 표시하기 → 식 세우기 → 검산하기', visual: '🧭' },
        { front: '오답 줄이기', back: '단위와 조건에 밑줄을 긋고 마지막 값을 확인합니다.', visual: '✅' }
      ],
      story: `3D 수학 실험실에서 ${grade}학년 ${month[0]} ${courseLabel} 미션을 수행합니다. ${theme[1]}`,
      mission: `${courseLabel} 카드 3장을 넘기고 대표 문제를 맞히면 별 1개를 얻습니다.`,
      quiz: mathQuiz(grade, monthIndex, mode),
      source: `푸르넷 수학 ${grade}학년 ${courseLabel} 월별 학습 데이터`
    };
  }

  function makeMathCourses() {
    const courses = [];
    for (let grade = 1; grade <= 6; grade += 1) {
      courses.push({
        id: `math-g${grade}-concept`,
        subject: 'math',
        title: `${grade}학년 수학 개념`,
        subtitle: '월별 교과 개념과 대표 유형',
        level: `${grade}학년`,
        accent: '#0b7f73',
        lessons: months.map((_, index) => makeMathLesson(grade, index, 'concept'))
      });
      courses.push({
        id: `math-g${grade}-operation`,
        subject: 'math',
        title: `${grade}학년 수학 연산`,
        subtitle: '정확도와 속도를 함께 기르는 연산 루틴',
        level: `${grade}학년 연산`,
        accent: '#dd5c4b',
        lessons: months.map((_, index) => makeMathLesson(grade, index, 'operation'))
      });
    }
    return courses;
  }

  function englishQuiz(track, index) {
    const target = track[2].split(/[.?!]/)[0].trim();
    return {
      type: 'choice',
      prompt: `"${track[2]}"에서 오늘 가장 먼저 따라 말할 표현은 무엇인가요?`,
      choices: [target, 'I cannot open it', 'Yesterday many books', 'Blue table under'],
      answer: target,
      explanation: '영어 학습은 짧은 모델 문장을 듣고, 따라 말하고, 실제 상황에 맞게 바꾸는 순서가 좋습니다.'
    };
  }

  function makeEnglishLesson(track, index) {
    return {
      id: `english-${track[0]}`,
      subject: 'english',
      grade: index < 8 ? '초등 영어' : '중등 영어',
      month: `${index + 1}단계`,
      title: track[1],
      subtitle: track[3],
      objective: track[3],
      canDo: track[3],
      visual: track[4],
      listenText: track[2],
      speakPrompt: track[2],
      cards: [
        { front: '듣기 문장', back: track[2], visual: '👂' },
        { front: '말하기 목표', back: track[3], visual: '💬' },
        { front: '오늘 산출물', back: '녹음, 문장 카드, 짧은 퀴즈 결과', visual: '🎯' }
      ],
      story: `3D 영어 스튜디오에서 ${track[1]} 미션을 수행합니다. 먼저 듣고, 따라 말하고, 짧은 문장으로 바꿔 봅니다.`,
      mission: `${track[2]} 문장을 듣고 따라 말한 뒤 퀴즈를 맞히면 별 1개를 얻습니다.`,
      quiz: englishQuiz(track, index),
      source: '푸르넷 영어 16트랙 학습 데이터'
    };
  }

  function makeEnglishCourses() {
    const coreLessons = englishTracks.map(makeEnglishLesson);
    return [
      {
        id: 'english-integrated',
        subject: 'english',
        title: '푸르넷 영어 통합 16트랙',
        subtitle: '유치·초등·중등 영어 듣기, 말하기, 파닉스, 문법, 독해 통합',
        level: 'Pre-A1~중등',
        accent: '#3157b8',
        lessons: coreLessons
      },
      {
        id: 'english-speaking-reading',
        subject: 'english',
        title: '영어 말하기·읽기 집중',
        subtitle: '노래, 회화, 읽기 유창성, 포트폴리오 산출물',
        level: '초등 실전',
        accent: '#6f58c9',
        lessons: coreLessons.filter((lesson) => /노래|말하기|읽기|포트폴리오|동화|회화/.test(lesson.title))
      },
      {
        id: 'english-voca-grammar',
        subject: 'english',
        title: '영어 어휘·문법 집중',
        subtitle: '파닉스, 필수 어휘, 기초 문법, 중등 문법, 내신 독해',
        level: '초중등 기반',
        accent: '#0c7f93',
        lessons: coreLessons.filter((lesson) => /파닉스|어휘|문법|독해|교과/.test(lesson.title))
      }
    ];
  }

  const courses = [...makeMathCourses(), ...makeEnglishCourses()];
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons.length, 0);

  window.PurunetAcademyData = {
    title: '푸르넷 영어 수학 학원',
    subjects: [
      { id: 'all', label: '통합', accent: '#17384c', visual: '🌐' },
      { id: 'math', label: '푸르넷 수학', accent: '#0b7f73', visual: 'Σ' },
      { id: 'english', label: '푸르넷 영어', accent: '#3157b8', visual: 'Aa' }
    ],
    courses,
    stats: {
      mathCourses: courses.filter((course) => course.subject === 'math').length,
      englishCourses: courses.filter((course) => course.subject === 'english').length,
      totalLessons
    }
  };
})();
