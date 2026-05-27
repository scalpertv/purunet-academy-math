// 푸르넷 영어 MVC 학습 프로그램의 샘플 콘텐츠 데이터
(function () {
  "use strict";

  const stageOrder = [
    { id: "diagnose", label: "진단" },
    { id: "prepare", label: "준비" },
    { id: "notice", label: "발견" },
    { id: "practice", label: "연습" },
    { id: "communicate", label: "사용" },
    { id: "feedback", label: "피드백" },
    { id: "reflect", label: "성찰" }
  ];

  const axes = ["입문·흥미", "소리·문자", "교과·내신", "문해력·산출"];

  const tracks = [
    {
      id: "kindergarten",
      code: "K",
      title: "유치원 영어반",
      db: "english_kindergarten_class",
      axis: "입문·흥미",
      level: "Pre-A1",
      tesolFocus: "oral language, routines, TPR",
      objective: "I can say hello and show how I feel.",
      canDo: "I can say hello and choose a feeling card.",
      output: "그림카드 반응, 챈트 따라 말하기",
      listenText: "Hello. I am happy. How are you today?",
      readingText: "Hello. I am happy. I can clap and say hello.",
      speakPrompt: "Hello. I am happy. How are you?",
      writingPrompt: "그림카드 한 장을 고르고 I am ... 문장을 완성하세요.",
      quiz: {
        question: "happy의 뜻과 가장 가까운 그림은 무엇인가요?",
        choices: ["기쁜 얼굴", "잠자는 얼굴", "화난 얼굴", "비 오는 그림"],
        answer: 0
      },
      language: {
        form: "I am + feeling.",
        meaning: "내 기분을 말한다.",
        use: "인사 후 내 상태를 짧게 말할 때 사용한다.",
        pronunciation: "I am은 자연스럽게 /aɪ əm/으로 이어 읽는다.",
        appropriacy: "친구, 선생님, 가족에게 모두 자연스럽다.",
        commonErrors: "I happy처럼 be동사를 빠뜨리기 쉽다.",
        ccq: "내 기분을 말하고 있나요.",
        modelSentence: "I am happy."
      }
    },
    {
      id: "karaoke",
      code: "S",
      title: "영어 노래방",
      db: "english_karaoke_class",
      axis: "입문·흥미",
      level: "Pre-A1~A2",
      tesolFocus: "pronunciation, rhythm, confidence",
      objective: "I can sing a short chant with clear rhythm.",
      canDo: "I can repeat a song chunk with rhythm.",
      output: "노래 녹음, 리듬 체크",
      listenText: "Hello, hello, wave your hand. Hello, hello, I can stand.",
      readingText: "Hello, hello, wave your hand. Hello, hello, I can stand.",
      speakPrompt: "Hello, hello, wave your hand.",
      writingPrompt: "노래에서 반복되는 표현 하나를 골라 새 문장을 만들어 보세요.",
      quiz: {
        question: "wave your hand는 어떤 행동인가요?",
        choices: ["손 흔들기", "책 읽기", "문 열기", "물 마시기"],
        answer: 0
      },
      language: {
        form: "Verb + your + body part.",
        meaning: "몸동작을 지시한다.",
        use: "노래, TPR, 교실 활동에서 사용한다.",
        pronunciation: "wave your hand에서 wave와 your를 끊지 않고 말한다.",
        appropriacy: "활동 지시나 노래 가사에 자연스럽다.",
        commonErrors: "your를 you로 바꾸기 쉽다.",
        ccq: "이 표현은 생각을 말하나요, 행동을 시키나요.",
        modelSentence: "Wave your hand."
      }
    },
    {
      id: "listening",
      code: "L",
      title: "영어 듣기",
      db: "english_listening_class",
      axis: "소리·문자",
      level: "A1.1",
      tesolFocus: "bottom-up and top-down listening",
      objective: "I can understand a classroom request.",
      canDo: "I can catch the key action in a classroom sentence.",
      output: "듣기 근거, 받아쓰기, 섀도잉 기록",
      listenText: "Open your book to page ten. Listen and repeat after me.",
      readingText: "Open your book to page ten. Listen and repeat after me.",
      speakPrompt: "Open your book to page ten.",
      writingPrompt: "들은 문장에서 행동을 나타내는 단어를 써 보세요.",
      quiz: {
        question: "선생님이 학생에게 먼저 하라고 한 행동은 무엇인가요?",
        choices: ["책 열기", "창문 닫기", "노래 부르기", "이름 쓰기"],
        answer: 0
      },
      language: {
        form: "Imperative verb + object.",
        meaning: "상대에게 해야 할 일을 알려준다.",
        use: "교실 지시문과 활동 안내에서 자주 쓴다.",
        pronunciation: "Open your는 /ˈoʊpən jər/처럼 약하게 이어진다.",
        appropriacy: "교실 지시에 적절하다.",
        commonErrors: "page와 book의 위치를 바꾸기 쉽다.",
        ccq: "학생이 무언가를 해야 하나요.",
        modelSentence: "Open your book."
      }
    },
    {
      id: "speaking",
      code: "SP",
      title: "영어 말하기",
      db: "english_speaking_class",
      axis: "소리·문자",
      level: "A1.1",
      tesolFocus: "spoken interaction and production",
      objective: "I can introduce myself and ask one question.",
      canDo: "I can say my name and ask your name.",
      output: "역할극 녹음, 질문응답 기록",
      listenText: "Hi, I am Mina. What is your name?",
      readingText: "Hi, I am Mina. What is your name? Nice to meet you.",
      speakPrompt: "Hi, I am ____. What is your name?",
      writingPrompt: "자기소개 문장 2개와 질문 1개를 써 보세요.",
      quiz: {
        question: "상대의 이름을 물을 때 알맞은 표현은 무엇인가요?",
        choices: ["What is your name?", "Where is my book?", "How old is it?", "Can I sit down?"],
        answer: 0
      },
      language: {
        form: "I am + name. What is your name?",
        meaning: "나를 소개하고 상대 이름을 묻는다.",
        use: "처음 만난 사람과 인사할 때 사용한다.",
        pronunciation: "What is는 /wʌt ɪz/ 또는 자연스럽게 /wʌts/로 들릴 수 있다.",
        appropriacy: "또래와 첫 만남에 자연스럽다.",
        commonErrors: "My name is와 I am을 섞어 My name am으로 말하기 쉽다.",
        ccq: "상대 이름을 알고 있나요, 물어보고 있나요.",
        modelSentence: "What is your name?"
      }
    },
    {
      id: "phonics",
      code: "P",
      title: "영어 파닉스 교실",
      db: "english_phonics_classroom",
      axis: "소리·문자",
      level: "Pre-A1~A1.1",
      tesolFocus: "phonology and decoding",
      objective: "I can blend CVC words with short a.",
      canDo: "I can read cat, map, and bag.",
      output: "음가 통과표, decoding 기록",
      listenText: "c-a-t, cat. m-a-p, map. b-a-g, bag.",
      readingText: "cat map bag. A cat has a bag.",
      speakPrompt: "c-a-t, cat.",
      writingPrompt: "short a 소리가 들어간 단어 3개를 써 보세요.",
      quiz: {
        question: "cat의 가운데 소리는 무엇인가요?",
        choices: ["/æ/", "/iː/", "/oʊ/", "/uː/"],
        answer: 0
      },
      language: {
        form: "consonant + short vowel + consonant.",
        meaning: "CVC 단어를 소리 단위로 합쳐 읽는다.",
        use: "초기 읽기와 철자 쓰기의 기초다.",
        pronunciation: "short a는 /æ/로 입을 넓게 벌려 낸다.",
        appropriacy: "파닉스 입문 단계에 맞다.",
        commonErrors: "/æ/를 /e/처럼 짧게 말하기 쉽다.",
        ccq: "세 소리를 합치면 한 단어가 되나요.",
        modelSentence: "c-a-t, cat."
      }
    },
    {
      id: "reading-fluency",
      code: "RF",
      title: "영어 읽기",
      db: "english_reading_fluency",
      axis: "소리·문자",
      level: "A1.1~A2",
      tesolFocus: "fluency and word reading",
      objective: "I can read a short paragraph with clear chunks.",
      canDo: "I can read short sentences aloud smoothly.",
      output: "정확도, 속도, 억양, 재읽기 기록",
      listenText: "I have a small dog. It likes to run in the park.",
      readingText: "I have a small dog. / It likes to run / in the park. / We play together / after school.",
      speakPrompt: "I have a small dog. It likes to run in the park.",
      writingPrompt: "읽은 글에서 who, what, where를 찾아 써 보세요.",
      quiz: {
        question: "강아지는 어디에서 달리기를 좋아하나요?",
        choices: ["공원", "도서관", "교실", "버스"],
        answer: 0
      },
      language: {
        form: "simple present sentences.",
        meaning: "일상적으로 하는 일을 말한다.",
        use: "짧은 묘사 글에서 사용한다.",
        pronunciation: "문장 끝을 너무 올리지 않고 자연스럽게 내린다.",
        appropriacy: "초급 읽기 유창성 훈련에 적절하다.",
        commonErrors: "likes의 /s/ 소리를 빠뜨리기 쉽다.",
        ccq: "강아지가 한 번만 달리나요, 자주 달리나요.",
        modelSentence: "It likes to run."
      }
    },
    {
      id: "elementary-textbook",
      code: "ET",
      title: "초등 영어 교과서",
      db: "english_elementary_textbook",
      axis: "교과·내신",
      level: "A1.1~A1.2",
      tesolFocus: "communicative functions",
      objective: "I can ask for permission politely.",
      canDo: "I can use Can I ...? in class.",
      output: "단원 표현 사용, 짝 활동 결과",
      listenText: "Can I sit here? Yes, you can. Thank you.",
      readingText: "Can I sit here? Yes, you can. Thank you.",
      speakPrompt: "Can I sit here?",
      writingPrompt: "Can I로 시작하는 교실 표현 2개를 써 보세요.",
      quiz: {
        question: "허락을 구하는 표현은 무엇인가요?",
        choices: ["Can I sit here?", "I can run fast.", "This is my bag.", "I like music."],
        answer: 0
      },
      language: {
        form: "Can I + base verb ...?",
        meaning: "내가 어떤 행동을 해도 되는지 묻는다.",
        use: "교실, 가정, 친구 사이에서 허락을 구할 때 쓴다.",
        pronunciation: "Can I는 /kæn aɪ/로 이어진다.",
        appropriacy: "please를 붙이면 더 공손하다.",
        commonErrors: "Can I to sit처럼 to를 넣기 쉽다.",
        ccq: "이미 앉고 있나요, 앉아도 되는지 묻고 있나요.",
        modelSentence: "Can I sit here?"
      }
    },
    {
      id: "elementary-vocabulary",
      code: "EV",
      title: "초등 필수 영단어",
      db: "english_elementary_vocabulary",
      axis: "교과·내신",
      level: "A1.1~A1.2",
      tesolFocus: "lexical development",
      objective: "I can use classroom words in a sentence.",
      canDo: "I can say and spell classroom objects.",
      output: "누적 어휘, 예문 사용",
      listenText: "book, pencil, desk, chair. This is my pencil.",
      readingText: "This is my pencil. That is your book.",
      speakPrompt: "This is my pencil.",
      writingPrompt: "book, pencil, desk 중 2개를 넣어 문장을 쓰세요.",
      quiz: {
        question: "pencil의 뜻은 무엇인가요?",
        choices: ["연필", "책상", "의자", "가방"],
        answer: 0
      },
      language: {
        form: "This is my + noun.",
        meaning: "가까운 물건이 내 것임을 말한다.",
        use: "교실 물건을 소개할 때 사용한다.",
        pronunciation: "pencil의 첫 음절에 강세를 둔다.",
        appropriacy: "초등 교실 어휘에 적절하다.",
        commonErrors: "pencle처럼 철자를 틀리기 쉽다.",
        ccq: "말하는 사람 가까이에 있나요.",
        modelSentence: "This is my pencil."
      }
    },
    {
      id: "elementary-grammar",
      code: "EG",
      title: "초등 영문법",
      db: "english_elementary_grammar",
      axis: "교과·내신",
      level: "A1.2",
      tesolFocus: "language systems",
      objective: "I can make a be-verb sentence.",
      canDo: "I can use am, are, is in simple sentences.",
      output: "문장 생성, 오류 수정",
      listenText: "I am a student. You are my friend. She is kind.",
      readingText: "I am a student. You are my friend. She is kind.",
      speakPrompt: "I am a student.",
      writingPrompt: "am, are, is를 각각 넣어 문장 3개를 쓰세요.",
      quiz: {
        question: "She ___ kind. 빈칸에 알맞은 말은 무엇인가요?",
        choices: ["is", "am", "are", "be"],
        answer: 0
      },
      language: {
        form: "subject + be verb + complement.",
        meaning: "누구인지 또는 어떤 상태인지 말한다.",
        use: "소개, 상태, 특징을 말할 때 쓴다.",
        pronunciation: "She is는 자연스럽게 /ʃiː ɪz/로 이어진다.",
        appropriacy: "초등 기본 문장 구조에 맞다.",
        commonErrors: "He are처럼 주어와 be동사를 맞추지 못하기 쉽다.",
        ccq: "kind는 행동인가요, 성격이나 상태인가요.",
        modelSentence: "She is kind."
      }
    },
    {
      id: "writing",
      code: "W",
      title: "영어 쓰기",
      db: "english_writing_class",
      axis: "문해력·산출",
      level: "A1.2~A2",
      tesolFocus: "productive skill and process writing",
      objective: "I can write a short paragraph about my day.",
      canDo: "I can write three connected sentences.",
      output: "초안, 첨삭본, 최종본",
      listenText: "Today is Monday. I go to school. I play soccer after school.",
      readingText: "Today is Monday. I go to school. I play soccer after school.",
      speakPrompt: "Tell your partner one thing you do after school.",
      writingPrompt: "Today로 시작해 하루 일과를 세 문장으로 쓰세요.",
      quiz: {
        question: "문단의 첫 문장으로 가장 자연스러운 것은 무엇인가요?",
        choices: ["Today is Monday.", "Soccer after.", "I happy.", "Book the is."],
        answer: 0
      },
      language: {
        form: "time word + subject + verb.",
        meaning: "시간 순서대로 하루 일을 말한다.",
        use: "일기, 짧은 문단, 발표문에서 사용한다.",
        pronunciation: "쓰기 전 소리내어 읽으면 어색한 어순을 찾기 쉽다.",
        appropriacy: "초급 문단 쓰기에 적절하다.",
        commonErrors: "동사를 빠뜨리거나 문장 끝 마침표를 빠뜨리기 쉽다.",
        ccq: "한 문장만 쓰나요, 연결된 여러 문장을 쓰나요.",
        modelSentence: "Today is Monday."
      }
    },
    {
      id: "middle-vocabulary",
      code: "MV",
      title: "중등 필수 영단어",
      db: "english_middle_vocabulary",
      axis: "교과·내신",
      level: "A2",
      tesolFocus: "academic and exam vocabulary",
      objective: "I can infer a word from context.",
      canDo: "I can guess the meaning of protect in a sentence.",
      output: "어휘 노트, 예문 독해",
      listenText: "We should protect the Earth by saving water.",
      readingText: "We should protect the Earth by saving water and using less plastic.",
      speakPrompt: "We should protect the Earth.",
      writingPrompt: "protect, save, environment 중 2개를 넣어 문장을 쓰세요.",
      quiz: {
        question: "protect의 뜻으로 가장 알맞은 것은 무엇인가요?",
        choices: ["보호하다", "잊다", "던지다", "빌리다"],
        answer: 0
      },
      language: {
        form: "protect + object.",
        meaning: "해를 입지 않게 지킨다.",
        use: "환경, 사람, 권리, 동물을 말할 때 쓴다.",
        pronunciation: "protect는 두 번째 음절에 강세가 있다.",
        appropriacy: "중등 교과와 독해에 자주 나온다.",
        commonErrors: "protect to Earth처럼 전치사를 넣기 쉽다.",
        ccq: "무언가를 안전하게 지키는 뜻인가요.",
        modelSentence: "We should protect the Earth."
      }
    },
    {
      id: "middle-grammar",
      code: "MG",
      title: "중등 영문법",
      db: "english_middle_grammar",
      axis: "교과·내신",
      level: "A2",
      tesolFocus: "accuracy and sentence analysis",
      objective: "I can use because to connect ideas.",
      canDo: "I can write a reason with because.",
      output: "문장 분석, 서술형 답안",
      listenText: "I stayed home because it was raining.",
      readingText: "I stayed home because it was raining. I read a book in my room.",
      speakPrompt: "I stayed home because it was raining.",
      writingPrompt: "because를 사용해 이유를 나타내는 문장을 쓰세요.",
      quiz: {
        question: "I was late ___ the bus was slow. 빈칸에 알맞은 말은 무엇인가요?",
        choices: ["because", "but", "and", "or"],
        answer: 0
      },
      language: {
        form: "main clause + because + reason clause.",
        meaning: "이유를 연결한다.",
        use: "설명, 서술형 답안, 의견 쓰기에서 사용한다.",
        pronunciation: "because는 약하게 /bɪˈkɔːz/로 들릴 수 있다.",
        appropriacy: "말하기와 쓰기 모두 자연스럽다.",
        commonErrors: "Because만으로 문장을 끝내기 쉽다.",
        ccq: "because 뒤에는 이유가 오나요.",
        modelSentence: "I stayed home because it was raining."
      }
    },
    {
      id: "school-exam",
      code: "EX",
      title: "영어 내신 대비반",
      db: "english_school_exam_textbook",
      axis: "교과·내신",
      level: "A2~B1",
      tesolFocus: "content-language integration",
      objective: "I can analyze a textbook sentence for exam points.",
      canDo: "I can find grammar and vocabulary in a school text.",
      output: "본문 분석 노트, 변형 문제 오답",
      listenText: "Many students learn English because it connects them to the world.",
      readingText: "Many students learn English because it connects them to the world.",
      speakPrompt: "Explain the grammar point in one sentence.",
      writingPrompt: "본문 문장에서 주어, 동사, 접속사를 표시하고 해석하세요.",
      quiz: {
        question: "because가 이끄는 절의 역할은 무엇인가요?",
        choices: ["이유 설명", "장소 설명", "사람 소개", "명령 표현"],
        answer: 0
      },
      language: {
        form: "because + subject + verb.",
        meaning: "앞 문장의 이유를 설명한다.",
        use: "본문 분석과 서술형 근거 제시에 사용한다.",
        pronunciation: "시험 대비에서는 소리보다 구조 분석을 우선한다.",
        appropriacy: "교과서 본문 분석에 적절하다.",
        commonErrors: "because절을 독립 문장으로 잘못 해석하기 쉽다.",
        ccq: "이 절은 앞 내용의 이유인가요.",
        modelSentence: "They learn English because it connects them to the world."
      }
    },
    {
      id: "reading-class",
      code: "RC",
      title: "영어 리딩반",
      db: "english_reading_class",
      axis: "문해력·산출",
      level: "A2",
      tesolFocus: "strategic reading",
      objective: "I can find the main idea and evidence.",
      canDo: "I can mark evidence for my answer.",
      output: "근거 표시, 요약문",
      listenText: "Trees help people by giving shade and clean air.",
      readingText: "Trees help people in many ways. They give shade on hot days. They also help keep the air clean. For these reasons, cities need more trees.",
      speakPrompt: "Tell the main idea of the passage.",
      writingPrompt: "중심 내용 1문장과 근거 2개를 쓰세요.",
      quiz: {
        question: "이 글의 중심 내용은 무엇인가요?",
        choices: ["도시에 나무가 필요하다", "더운 날은 위험하다", "공기는 보이지 않는다", "사람은 그늘을 싫어한다"],
        answer: 0
      },
      language: {
        form: "main idea + supporting details.",
        meaning: "중심 내용과 근거를 연결한다.",
        use: "독해 문제와 요약 쓰기에서 사용한다.",
        pronunciation: "소리내어 읽기보다 의미 단위 끊어 읽기를 강조한다.",
        appropriacy: "리딩 전략 학습에 적절하다.",
        commonErrors: "세부 정보를 중심 내용으로 고르기 쉽다.",
        ccq: "이 문장이 전체 글을 대표하나요.",
        modelSentence: "Cities need more trees."
      }
    },
    {
      id: "storybook",
      code: "ST",
      title: "영어 동화책",
      db: "english_storybook_class",
      axis: "입문·흥미",
      level: "Pre-A1~A1.2",
      tesolFocus: "story-based language learning",
      objective: "I can retell a short story scene.",
      canDo: "I can say what happened first and next.",
      output: "역할극, 다시 말하기, 독후활동",
      listenText: "The little seed sleeps in the ground. Rain falls. The seed grows.",
      readingText: "The little seed sleeps in the ground. Rain falls. The seed grows into a green plant.",
      speakPrompt: "First, the seed sleeps. Next, rain falls.",
      writingPrompt: "First와 Next를 사용해 이야기 순서를 써 보세요.",
      quiz: {
        question: "비가 온 뒤 씨앗은 어떻게 되었나요?",
        choices: ["자랐다", "사라졌다", "노래했다", "책을 읽었다"],
        answer: 0
      },
      language: {
        form: "First, ... Next, ...",
        meaning: "이야기 순서를 말한다.",
        use: "다시 말하기와 독후활동에서 사용한다.",
        pronunciation: "First의 /fɜːrst/ 끝소리를 분명히 말한다.",
        appropriacy: "동화 다시 말하기에 자연스럽다.",
        commonErrors: "Next와 Last의 순서를 섞기 쉽다.",
        ccq: "First는 처음 일어난 일인가요.",
        modelSentence: "First, the seed sleeps."
      }
    },
    {
      id: "library",
      code: "LB",
      title: "영어 도서관",
      db: "english_library",
      axis: "문해력·산출",
      level: "Pre-A1~B1",
      tesolFocus: "extensive reading and autonomy",
      objective: "I can choose a book and write a short reading log.",
      canDo: "I can record title, level, and one favorite part.",
      output: "읽기 기록장, 추천 도서, 독후 포트폴리오",
      listenText: "Choose a book. Read for ten minutes. Write one favorite sentence.",
      readingText: "Book log. Title: My Park. Level: A1. Favorite part: The children plant trees.",
      speakPrompt: "My favorite part is the children plant trees.",
      writingPrompt: "읽은 책 제목, 레벨, 마음에 든 장면을 기록하세요.",
      quiz: {
        question: "reading log에 꼭 들어가야 할 정보는 무엇인가요?",
        choices: ["책 제목", "버스 번호", "날씨 예보", "점심 메뉴"],
        answer: 0
      },
      language: {
        form: "My favorite part is + noun phrase.",
        meaning: "책에서 마음에 든 부분을 말한다.",
        use: "book talk와 독후 기록에 사용한다.",
        pronunciation: "favorite은 첫 음절에 강세가 있다.",
        appropriacy: "자기주도 다독 기록에 적절하다.",
        commonErrors: "favorite part를 favorite scene과 혼동할 수 있다.",
        ccq: "내가 가장 좋아한 부분을 말하나요.",
        modelSentence: "My favorite part is the ending."
      }
    }
  ];

  const vocabularyBank = [
    {
      id: "vocab-protect",
      level: "A2",
      word: "protect",
      meaning: "보호하다",
      partOfSpeech: "verb",
      pronunciation: "/prəˈtekt/",
      context: "We should protect the Earth by saving water.",
      collocations: ["protect the Earth", "protect animals", "protect your eyes"],
      wordFamily: ["protection", "protective"],
      distractors: ["forget", "borrow", "throw"],
      retrievalPrompt: "protect의 뜻과 가장 가까운 말을 고르세요.",
      productionPrompt: "protect를 사용해 환경 보호 문장을 쓰세요.",
      aiLiteracyNote: "AI 번역 결과를 그대로 외우지 말고 문장 속 쓰임을 확인하세요."
    },
    {
      id: "vocab-confident",
      level: "A2",
      word: "confident",
      meaning: "자신감 있는",
      partOfSpeech: "adjective",
      pronunciation: "/ˈkɑːnfədənt/",
      context: "I feel confident when I practice speaking every day.",
      collocations: ["feel confident", "be confident about", "confident speaker"],
      wordFamily: ["confidence", "confidently"],
      distractors: ["silent", "hungry", "cloudy"],
      retrievalPrompt: "confident의 뜻과 가장 가까운 말을 고르세요.",
      productionPrompt: "confident를 사용해 영어 말하기 목표 문장을 쓰세요.",
      aiLiteracyNote: "발음 피드백 도구가 틀릴 수 있으므로 모델 음성과 내 녹음을 함께 비교하세요."
    },
    {
      id: "vocab-evidence",
      level: "A2~B1",
      word: "evidence",
      meaning: "근거, 증거",
      partOfSpeech: "noun",
      pronunciation: "/ˈevɪdəns/",
      context: "Find evidence in the text before you choose the answer.",
      collocations: ["find evidence", "clear evidence", "text evidence"],
      wordFamily: ["evident", "evidently"],
      distractors: ["guess", "noise", "habit"],
      retrievalPrompt: "evidence의 뜻과 가장 가까운 말을 고르세요.",
      productionPrompt: "evidence를 사용해 독해 근거 찾기 문장을 쓰세요.",
      aiLiteracyNote: "AI가 제시한 답도 지문 근거와 대조해야 합니다."
    },
    {
      id: "vocab-improve",
      level: "A1.2~A2",
      word: "improve",
      meaning: "향상시키다, 나아지다",
      partOfSpeech: "verb",
      pronunciation: "/ɪmˈpruːv/",
      context: "You can improve your writing by rewriting your first draft.",
      collocations: ["improve writing", "improve quickly", "improve skills"],
      wordFamily: ["improvement"],
      distractors: ["hide", "arrive", "paint"],
      retrievalPrompt: "improve의 뜻과 가장 가까운 말을 고르세요.",
      productionPrompt: "improve를 사용해 이번 주 학습 목표를 쓰세요.",
      aiLiteracyNote: "자동 첨삭은 최종 판단자가 아니라 다시 쓰기를 돕는 보조 도구입니다."
    }
  ];

  const grammarPatterns = [
    {
      id: "grammar-because",
      level: "A2",
      title: "because 이유절",
      form: "main clause + because + reason clause",
      meaning: "앞 내용의 이유를 설명한다.",
      use: "의견 쓰기, 서술형 답안, 발표 근거 말하기에 사용한다.",
      model: "I stayed home because it was raining.",
      wrongSentence: "Because it was raining.",
      correctedSentence: "I stayed home because it was raining.",
      transformPrompt: "I was late. The bus was slow.",
      transformAnswer: "I was late because the bus was slow.",
      productionPrompt: "because를 사용해 영어 공부를 해야 하는 이유를 쓰세요.",
      commonError: "because절만 단독으로 써서 문장이 불완전해지는 오류가 많다."
    },
    {
      id: "grammar-can-i",
      level: "A1.1",
      title: "Can I 허락 구하기",
      form: "Can I + base verb ...?",
      meaning: "내가 어떤 행동을 해도 되는지 묻는다.",
      use: "교실, 가정, 친구 사이에서 공손하게 허락을 구할 때 사용한다.",
      model: "Can I sit here?",
      wrongSentence: "Can I to sit here?",
      correctedSentence: "Can I sit here?",
      transformPrompt: "I want to open the window.",
      transformAnswer: "Can I open the window?",
      productionPrompt: "Can I를 사용해 교실에서 쓸 수 있는 문장 하나를 쓰세요.",
      commonError: "Can I 뒤에 to를 넣는 오류가 잦다."
    },
    {
      id: "grammar-present-simple",
      level: "A1.2",
      title: "현재시제 습관 말하기",
      form: "subject + base verb / subject + verb-s",
      meaning: "반복되는 습관이나 사실을 말한다.",
      use: "일상 루틴, 취미, 소개 글에서 사용한다.",
      model: "She reads every night.",
      wrongSentence: "She read every night.",
      correctedSentence: "She reads every night.",
      transformPrompt: "He play soccer after school.",
      transformAnswer: "He plays soccer after school.",
      productionPrompt: "현재시제를 사용해 나의 영어 공부 루틴을 쓰세요.",
      commonError: "3인칭 단수 주어 뒤 동사에 -s를 빠뜨리기 쉽다."
    },
    {
      id: "grammar-comparative",
      level: "A2",
      title: "비교급으로 의견 말하기",
      form: "subject + be + comparative adjective + than ...",
      meaning: "두 대상을 비교한다.",
      use: "책, 활동, 학습 방법을 비교해 의견을 말할 때 사용한다.",
      model: "Reading aloud is easier than writing a summary.",
      wrongSentence: "Reading aloud is more easy than writing.",
      correctedSentence: "Reading aloud is easier than writing.",
      transformPrompt: "This story is interesting. That story is not very interesting.",
      transformAnswer: "This story is more interesting than that story.",
      productionPrompt: "비교급을 사용해 두 영어 학습 방법을 비교하세요.",
      commonError: "easy처럼 짧은 형용사에 more를 붙이는 오류가 많다."
    }
  ];

  window.PrunetEnglishData = {
    axes,
    stageOrder,
    tracks,
    vocabularyBank,
    grammarPatterns
  };
})();
