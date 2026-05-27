# NLP 기반 영어 문장 분석 — 끊어읽기·문장 부호 활용 학습 고도화 연구

> 작성일: 2026-05-25 | 대상: 초등·중등·고등 내신 영문법 앱 고도화

---

## 1. 배경과 필요성

### 1.1 끊어읽기(Phrase Chunking)란?

끊어읽기는 연속된 영어 문장을 **의미 단위(chunk)** 로 나누어 읽는 기술로, 한국 영어 교육에서 독해력·청해력의 핵심 전략으로 다룬다. NLP 관점에서는 **Shallow Parsing** 또는 **Chunking** 이라 부른다.

```
원문:  The movie / that I watched / was great.
청크:  [명사구 NP]  [관계절 REL]   [동사구 VP]
```

### 1.2 연구 근거

| 연구 | 핵심 결과 |
|------|----------|
| Effects of Chunking on Reading Comprehension of EFL (2010, 한국) | 끊어읽기 훈련 집단이 대조군 대비 독해 점수 유의미하게 향상 |
| Individual Chunking Ability Predicts L2 Processing (2021, PubMed) | 청크 처리 능력이 L2 전체 읽기 속도를 예측하는 강력한 변수 |
| Two-Stage Chunking Operation in Reading (2020, PubMed) | 독자는 먼저 형태·어휘 수준, 다음 통사 수준의 2단계로 청크를 형성 |
| ChatGPT & Korean EFL Learners (2024) | AI 기반 Top-down 처리 훈련이 독해 향상에 통계적으로 유의미 |
| AI in Language Learning (Nature, 2025) | NLP 기반 ITS(지능형 튜터링 시스템)가 반복 학습 사이클을 가속 |

---

## 2. 핵심 NLP 기술 체계

### 2.1 기술 스택 전체 그림

```
문장 입력
   │
   ▼
[1] 토크나이징 (Tokenization)
   → "She had a great time." → ["She", "had", "a", "great", "time", "."]
   │
   ▼
[2] 품사 태깅 (POS Tagging)
   → She/PRP  had/VBD  a/DT  great/JJ  time/NN  ./PUNCT
   │
   ▼
[3] 청크 분석 (Shallow Parsing / Chunking)
   → [NP She] [VP had] [NP a great time]
   │
   ├── [4a] 의존 구문 분석 (Dependency Parsing)
   │       → had ← nsubj ← She
   │         had → dobj → time
   │
   └── [4b] 구성소 구문 분석 (Constituency Parsing)
           → (S (NP She) (VP had (NP a great time)))
   │
   ▼
[5] 교육 피드백 생성
   → 끊어읽기 표시 / 문법 오류 지적 / 구조 색상 강조
```

### 2.2 POS 태그 대응표 (Penn Treebank 기준)

| 태그 | 품사 | 예시 |
|------|------|------|
| NN / NNS | 명사 / 복수명사 | book / books |
| NNP | 고유명사 | Seoul |
| PRP | 인칭대명사 | She, He, They |
| VB / VBZ / VBD / VBG / VBN | 동사 원형/3단/과거/현재분사/과거분사 | go/goes/went/going/gone |
| JJ / JJR / JJS | 형용사/비교/최상 | big/bigger/biggest |
| RB / RBR | 부사/비교부사 | quickly/faster |
| DT | 관사·한정사 | a, the, this |
| IN | 전치사·접속사 | in, of, because |
| CC | 등위접속사 | and, but, or |
| WP / WRB / WDT | 관계대명사/관계부사/관계한정사 | who, where, which |
| MD | 조동사 | can, will, must |
| TO | to부정사 마커 | to |

### 2.3 청크 레이블

| 청크 | 의미 | 구성 규칙 (regex 스타일) |
|------|------|------------------------|
| NP | 명사구 | `DT? JJ* (NN|NNS|NNP)+` |
| VP | 동사구 | `MD? (VB|VBZ|VBD|VBG|VBN)+` |
| PP | 전치사구 | `IN NP` |
| ADJP | 형용사구 | `RB? JJ+` |
| ADVP | 부사구 | `RB+` |
| SBAR | 종속절 | `(WP|WRB|WDT|IN) S` |

---

## 3. 주요 라이브러리 및 도구

### 3.1 Python 서버 사이드

#### spaCy (산업 표준)
- GitHub: [explosion/spaCy](https://github.com/explosion/spaCy)
- 기능: 토크나이징, POS, 의존 구문, NER, 내장 시각화(displaCy)
- 특징: 초당 수천 문장 처리, 사전학습 모델 `en_core_web_sm/md/lg`

```python
import spacy
nlp = spacy.load("en_core_web_sm")
doc = nlp("She had a great time.")

for token in doc:
    print(f"{token.text:12} {token.pos_:8} {token.dep_:12} → {token.head.text}")
# She          PRON     nsubj        → had
# had          VERB     ROOT         → had
# a            DET      det          → time
# great        ADJ      amod         → time
# time         NOUN     dobj         → had
```

#### Stanford Stanza
- GitHub: [stanfordnlp/stanza](https://github.com/stanfordnlp/stanza)
- 기능: 의존 구문 + 구성소 구문 + NER, 70개 언어 지원
- 특징: Universal Dependencies 기반, 학술 정확도 최고 수준

```python
import stanza
nlp = stanza.Pipeline('en', processors='tokenize,pos,lemma,depparse,constituency')
doc = nlp("The novel was written by a scientist.")
print(doc.sentences[0].constituency)
# (ROOT (S (NP (DT The) (NN novel))
#           (VP (VBD was)
#               (VP (VBN written)
#                   (PP (IN by)
#                       (NP (DT a) (NN scientist)))))))
```

#### displaCy 시각화 서버
- GitHub: [explosion/displacy](https://github.com/explosion/displacy)
- 온라인 데모: [demos.explosion.ai/displacy](https://demos.explosion.ai/displacy)
- SVG 의존 구문 트리를 브라우저에서 바로 렌더링

### 3.2 JavaScript 클라이언트 사이드 (앱 직접 통합 가능)

#### compromise.js ⭐ (추천 — 현재 앱과 직접 통합 가능)
- GitHub: [nlpjs/compromise](https://github.com/spencermountain/compromise)
- 크기: ~250KB, 서버 불필요, 브라우저에서 즉시 동작
- 기능: POS 태깅, 명사구/동사구 추출, 시제 분석

```javascript
import nlp from 'compromise'

const doc = nlp('She made a birthday cake.')
doc.json()[0].terms.forEach(t =>
  console.log(t.text, t.tags)
)
// She       ['Pronoun', 'Noun', 'Singular']
// made      ['Verb', 'PastTense']
// a         ['Determiner']
// birthday  ['Noun', 'Singular']
// cake      ['Noun', 'Singular']

// 명사구 추출
doc.nouns().out('array')   // ['birthday cake']
// 동사구
doc.verbs().out('array')   // ['made']
```

#### wink-NLP
- GitHub: [winkjs/wink-nlp](https://github.com/winkjs/wink-nlp)
- 크기: ~10KB gzip, TypeScript 지원, 브라우저 동일 동작
- 기능: 토크나이징, POS, 감정 분석, 청크 경계 탐지

```javascript
import winkNLP from 'wink-nlp'
import model from 'wink-eng-lite-web-model'
const nlp = winkNLP(model)

const doc = nlp.readDoc('I have never seen such a painting.')
doc.tokens().each(t =>
  console.log(t.out(), t.out(its.pos))
)
```

### 3.3 온라인 데모 및 시각화 도구

| 도구 | URL | 용도 |
|------|-----|------|
| displaCy Live | https://demos.explosion.ai/displacy | 의존 구문 시각화 |
| Stanford CoreNLP Demo | https://corenlp.run | 구성소 트리 |
| HanLP Constituency | https://hanlp.hankcs.com/en/demos/con.html | 구성소 파싱 온라인 |
| NLP-progress Leaderboard | http://nlpprogress.com/english/constituency_parsing.html | 최신 모델 성능 비교 |

---

## 4. 문장 분석 예시 — 학년별

### 4.1 초등 (Grade 5–6)

#### 예문 1: `She made a birthday cake.` (불규칙 과거)

```
┌─────────────────────────────────────────────────┐
│  끊어읽기 (Phrase Chunks)                        │
│                                                  │
│  [She]    [made]    [a birthday cake]    [.]      │
│   NP주어    VP동사     NP목적어             PUNCT   │
└─────────────────────────────────────────────────┘

POS 분석:
  She        → PRP  대명사(Pronoun)   — 주어(S)
  made       → VBD  동사과거(Verb-Past) — 동사(V)  ← make의 불규칙 과거
  a          → DT   관사(Article)
  birthday   → NN   명사(Noun)
  cake       → NN   명사(Noun)        — 목적어(O)

문장 구조:  S(주어) + V(동사) + O(목적어)  ← 3형식

학습 포인트:
  ✔ make → made  (A-B-B형 불규칙 동사)
  ✔ 'a birthday cake' 전체가 하나의 명사구(NP)
  ✔ 끊어읽기: [She] — [made] — [a birthday cake]
```

#### 예문 2: `We went to the park yesterday.` (go 불규칙)

```
끊어읽기:
  [We]  [went]  [to the park]  [yesterday]
   NP    VP        PP(전치사구)    ADVP(부사구)

의존 관계 (→ = 수식/지배):
  went ← nsubj ← We
  went → obl   → park
             park ← det  ← the
             park ← case ← to
  went → advmod → yesterday

학습 포인트:
  ✔ go → went (A-B-C형 불규칙)
  ✔ 'to the park' = 전치사구(PP), 동사 went를 수식
  ✔ yesterday = 부사(Adverb), 시간 정보
```

---

### 4.2 중등 (Grade 중1–중3)

#### 예문 3: `The movie that I watched was great.` (관계대명사 목적격)

```
구성소 트리 (Constituency Tree):
(S
  (NP (DT The) (NN movie)
      (SBAR (WDT that)
            (S (NP (PRP I))
               (VP (VBD watched)))))
  (VP (VBD was)
      (ADJP (JJ great))))

끊어읽기:
  [The movie / that I watched]   [was]   [great]
       NP + 관계절(SBAR)           VP      ADJP

의존 구문:
  was ← nsubj ← movie
  was → acomp → great
  movie ← relcl ← watched
  watched ← nsubj ← I
  watched ← obj ← movie (gap — 관계절 흔적)

학습 포인트:
  ✔ 'that I watched' = 목적격 관계대명사절 → movie를 수식
  ✔ that = 관계대명사(목적어 역할, 생략 가능)
  ✔ was = 연결동사(Linking Verb), 뒤에 형용사 보어(SC)
  ✔ 문장 구조: S(주어+관계절) + V(동사) + SC(주격보어) ← 2형식
```

#### 예문 4: `She was given a second chance.` (4형식 수동태)

```
능동태 원형: Someone gave her a second chance.
                              IO         DO

수동태 변환:
  She      was given   a second chance
  S(주어)  V(수동)     O(직접목적어)

끊어읽기:
  [She]   [was given]    [a second chance]
   NP주어    VP수동태         NP목적어

POS 분석:
  She        → PRP  인칭대명사
  was        → VBD  be동사 과거
  given      → VBN  과거분사 ← give의 불규칙 (A-B-C형)
  a          → DT   관사
  second     → JJ   형용사
  chance     → NN   명사

학습 포인트:
  ✔ give → gave → given (A-B-C형 불규칙, 과거분사 = given)
  ✔ 수동태: be + p.p. → 과거분사(VBN) 필수
  ✔ 간접목적어(IO)가 주어 자리로 이동 → 4형식 수동태
```

#### 예문 5: `If I were you, I would apologize.` (가정법 과거)

```
구조 분석:
  [If I were you]    ,    [I would apologize]
   조건절(SBAR)              주절(S)

의존 구문:
  would-apologize ← advcl ← were (조건절 전체)
  were ← mark ← if
  were ← nsubj ← I
  were → obl → you

끊어읽기:
  [If] [I] [were] [you] // [I] [would apologize]
  접속사 S   V(가정)  O    S   조동사+V(귀결)

학습 포인트:
  ✔ If절: 과거형 동사 사용 (were — 1·3인칭도 were)
  ✔ 주절: would + 동사원형
  ✔ 현재 사실 반대 상상 → 가정법 과거(Subjunctive Past)
  ✔ 끊어읽기 경계: 쉼표(,)가 절 경계 신호
```

---

### 4.3 고등 (공통영어·영어 I·II)

#### 예문 6: `Having finished the exam, I felt relieved.` (완료분사구문)

```
구성소 트리:
(S
  (S (VP (VBG Having)
         (VP (VBN finished)
             (NP (DT the) (NN exam)))))
  (, ,)
  (NP (PRP I))
  (VP (VBD felt)
      (ADJP (VBN relieved))))

끊어읽기:
  [Having finished the exam]  ,  [I]  [felt]  [relieved]
   분사구문(Participial Phrase)    S(주어) V(동사)  OC(보어)

구조 해석:
  ① 분사구문 = 부사절 압축
     After I had finished the exam → Having finished the exam
     (완료분사: having + p.p. → 주절보다 앞선 시제)
  ② 주절: I felt relieved (S + V + OC 5형식 느낌, 실제는 2형식)

의존 구문:
  felt ← nsubj ← I
  felt → xcomp → relieved
  felt ← advcl ← finished (분사구문)
  finished → obj → exam

학습 포인트:
  ✔ Having p.p. = 완료분사구문 (주절보다 이전 사건)
  ✔ feel → felt → felt (A-B-B형 불규칙)
  ✔ finish → finished → finished (규칙 동사)
  ✔ 쉼표(,) = 분사구문과 주절의 경계 표지
```

#### 예문 7: `Never have I seen such a scene.` (부정어 도치)

```
원래 어순:   I have never seen such a scene.
도치 후:     Never have I seen such a scene.

끊어읽기:
  [Never]   [have I]   [seen]   [such a scene]
   부정부사   조동사+S    과거분사    NP목적어

의존 구문:
  seen ← aux ← have
  seen ← nsubj ← I
  seen → obj → scene
  seen ← advmod ← never (문두 이동)

청크 분석:
  ADVP: [Never]
  VP:   [have seen]
  NP:   [such a scene]

학습 포인트:
  ✔ 부정어(Never)가 문두 → 조동사(have)와 주어(I) 도치
  ✔ see → saw → seen (A-B-C형 불규칙)
  ✔ 'such a scene' = 강조 표현 (such + a/an + 형용사 + 명사)
  ✔ 끊어읽기: 도치 후에도 [never] / [have I] / [seen] / [such a scene]
```

#### 예문 8: `The device, which was invented in Korea, changed the market.` (계속적 관계대명사)

```
구성소 트리:
(S
  (NP (DT The) (NN device)
      (, ,)
      (SBAR (WHNP (WDT which))
            (S (VP (VBD was)
                   (VP (VBN invented)
                       (PP (IN in) (NP (NNP Korea)))))))
      (, ,))
  (VP (VBD changed)
      (NP (DT the) (NN market))))

끊어읽기 (쉼표 기준):
  [The device]  ,  [which was invented in Korea]  ,  [changed the market]
      NP주어          삽입 관계절(계속적 용법)              VP+NP

학습 포인트:
  ✔ 쉼표 + which = 계속적 관계대명사 (앞 절 전체 또는 선행사 부연)
  ✔ 'which was invented' = 수동태 삽입절
  ✔ invent → invented (규칙 동사 수동)
  ✔ 쉼표(,)가 두 번 → 삽입 구조(parenthetical) 신호
  ✔ 핵심 골격 파악: [The device] [changed the market]
```

---

## 5. 앱 통합 전략 — Purunet Academy 적용 방안

### 5.1 구현 난이도별 로드맵

| 단계 | 기능 | 난이도 | 필요 기술 |
|------|------|--------|----------|
| Phase 1 | 문장 색상 청크 강조 (정적) | ★☆☆ | 데이터 직접 입력 |
| Phase 2 | compromise.js 클라이언트 POS 태깅 | ★★☆ | JS 라이브러리 추가 |
| Phase 3 | 끊어읽기 경계 자동 탐지 및 표시 | ★★☆ | POS 규칙 기반 청크 |
| Phase 4 | spaCy API 서버 → 의존 트리 렌더링 | ★★★ | Python 백엔드 필요 |
| Phase 5 | 학습자 입력 문장 실시간 분석 피드백 | ★★★ | 서버 + 모델 통합 |

### 5.2 Phase 1 — 즉시 적용 가능: 정적 청크 색상 주석

현재 `examples` 배열에 HTML 주석을 추가하거나, 별도 `chunks` 필드를 추가해 색상 강조를 제공한다.

```javascript
unit('grade6', '불규칙 과거 Ⅵ — see·write·know', ...,
  // 기존 필드에 chunks 추가
  chunks: [
    { text: 'I',          role: 'S',  label: '주어' },
    { text: 'saw',        role: 'V',  label: '동사(see 과거)' },
    { text: 'a rainbow',  role: 'O',  label: '목적어' },
    { text: 'yesterday',  role: 'M',  label: '부사' }
  ]
)
```

```css
/* 청크 역할별 색상 */
.chunk-S  { background: #dcfce7; border-bottom: 2px solid #22c55e; } /* 주어 — 초록 */
.chunk-V  { background: #dbeafe; border-bottom: 2px solid #3b82f6; } /* 동사 — 파랑 */
.chunk-O  { background: #fef9c3; border-bottom: 2px solid #eab308; } /* 목적어 — 노랑 */
.chunk-OC { background: #fce7f3; border-bottom: 2px solid #ec4899; } /* 목적격보어 — 핑크 */
.chunk-SC { background: #ede9fe; border-bottom: 2px solid #8b5cf6; } /* 주격보어 — 보라 */
.chunk-M  { background: #f1f5f9; border-bottom: 2px solid #94a3b8; } /* 수식어 — 회색 */
```

### 5.3 Phase 2 — compromise.js 클라이언트 통합

```html
<!-- CDN 추가 (약 250KB) -->
<script src="https://unpkg.com/compromise"></script>
```

```javascript
function analyzeChunks(sentence) {
  var doc = nlp(sentence)
  var result = []

  doc.json()[0].terms.forEach(function (term) {
    var role = 'word'
    if (term.tags.includes('Pronoun') || term.tags.includes('ProperNoun')) role = 'S'
    else if (term.tags.includes('Verb')) role = 'V'
    else if (term.tags.includes('Noun')) role = 'O'
    else if (term.tags.includes('Adjective')) role = 'ADJ'
    else if (term.tags.includes('Adverb')) role = 'M'
    result.push({ text: term.text, role: role })
  })
  return result
}

// 개념 카드에 끊어읽기 시각화 추가
function renderChunkView(item) {
  var chunks = analyzeChunks(item.examples[0])
  return h('div', { class: 'esg-chunk-row' },
    chunks.map(function (c) {
      return h('span', { class: 'esg-chunk chunk-' + c.role, title: c.role }, c.text)
    })
  )
}
```

### 5.4 Phase 3 — 끊어읽기 경계 규칙 엔진

구두점 및 POS 패턴을 기반으로 슬래시(/) 경계를 자동 삽입한다.

```javascript
var CHUNK_BOUNDARIES = [
  // 쉼표 뒤는 항상 경계
  { pattern: /,/, before: false, after: true },
  // 접속사(because, although, when, if, that, which, who) 앞
  { tags: ['Conjunction', 'Preposition'], before: true, after: false },
  // 관계대명사 앞
  { words: ['that', 'which', 'who', 'whom', 'where', 'when', 'why'], before: true, after: false },
  // to부정사 앞
  { words: ['to'], nextTag: 'Verb', before: true, after: false }
]

function insertChunkBoundaries(sentence) {
  // POS 태깅 후 규칙 적용
  // 결과: "The movie / that I watched / was great."
}
```

### 5.5 TTS(음성합성)와 끊어읽기 연동

현재 앱에는 `speak()` 함수가 있다. 끊어읽기 경계마다 짧은 묵음(pause)을 삽입해 끊어읽기 방식의 TTS를 구현할 수 있다.

```javascript
function speakWithChunks(sentence) {
  var chunks = insertChunkBoundaries(sentence).split(' / ')
  var utterances = chunks.map(function (chunk) {
    var u = new SpeechSynthesisUtterance(chunk)
    u.lang = 'en-US'
    u.rate = 0.85        // 학습자용 속도
    return u
  })
  // 청크 사이 200ms 묵음
  utterances.forEach(function (u, i) {
    setTimeout(function () {
      speechSynthesis.speak(u)
    }, i * 300)
  })
}
```

---

## 6. 문장 부호(Punctuation)의 교육적 기능

| 부호 | NLP 역할 | 학습 적용 |
|------|---------|---------|
| , (쉼표) | 절 경계, 삽입구 경계 | 끊어읽기 경계 = 주절/부사절 분리 신호 |
| . (마침표) | 문장 경계(SBD) | 완전한 명제 단위 종료 |
| ? (물음표) | 의문문 감지 | 의문문 어순(조동사 도치) 강조 |
| ! (감탄부호) | 감탄문 감지 | What/How 감탄문 패턴 연결 |
| : (콜론) | 열거·설명 시작 | 앞 절과 뒤 내용의 논리 관계 |
| ; (세미콜론) | 절 연결 | 등위 관계 두 절 분리 |
| — (대시) | 강조 삽입구 | 계속적 관계대명사절과 유사 기능 |
| ' (아포스트로피) | 소유격, 축약형 | 'm/'s/'ve/'ll/'d 패턴 학습 |

### 쉼표 패턴 분류 (NLP 규칙 기반)

```
패턴 1: S, which/who VP, V ...
        → 계속적 관계대명사 삽입 (고등)

패턴 2: V-ing clause, S V ...
        → 분사구문 + 주절 (고등)

패턴 3: If S V, S would V ...
        → 가정법 조건절 (중3·고등)

패턴 4: First, ... Then, ... Finally, ...
        → 순서 부사 나열 (초등 6학년)

패턴 5: S V, but/and/so S V
        → 등위접속사로 연결된 중문 (중1)
```

---

## 7. 참고 자료 및 출처

### 학술 논문

- [Effects of Chunking on Reading Comprehension of EFL (영어어문교육, 2010)](https://koreascience.kr/article/JAKO201003939212472.pdf)
- [How Do We Segment Text? Two-Stage Chunking Operation in Reading (PubMed, 2020)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7294464/)
- [Individual Chunking Ability Predicts L2 Processing (PubMed, 2021)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7844092/)
- [AI in Language Learning (Nature, 2025)](https://www.nature.com/articles/s41599-025-04878-w.pdf)
- [ChatGPT & Korean EFL Learners Reading Comprehension (2024)](https://www.elanguageresearch.org/archive/view_article?pid=lr-60-1-83)
- [Chunking Strategies in EFL Vocational Education (2024)](https://jurnalp4i.com/index.php/educational/article/view/9989)

### GitHub 라이브러리

- [explosion/spaCy](https://github.com/explosion/spaCy) — 산업 표준 Python NLP
- [stanfordnlp/stanza](https://github.com/stanfordnlp/stanza) — Stanford NLP Python 라이브러리
- [explosion/spacy-stanza](https://github.com/explosion/spacy-stanza) — spaCy + Stanza 통합
- [explosion/displacy](https://github.com/explosion/displacy) — 의존 구문 시각화 JS
- [winkjs/wink-nlp](https://github.com/winkjs/wink-nlp) — 경량 브라우저 NLP
- [spencermountain/compromise](https://github.com/spencermountain/compromise) — 브라우저 NLP (compromise.js)

### 기술 문서 및 튜토리얼

- [spaCy displaCy 시각화](https://spacy.io/usage/visualizers)
- [Stanza 의존 구문 분석](https://stanfordnlp.github.io/stanza/depparse.html)
- [Stanford CoreNLP 구성소 파싱](https://stanfordnlp.github.io/CoreNLP/parse.html)
- [Chunking: Shallow Parsing for Phrase Identification](https://mbrenndoerfer.com/writing/chunking-shallow-parsing-nlp)
- [POS Tagging & Chunking in NLP (Guru99)](https://www.guru99.com/pos-tagging-chunking-nltk.html)
- [Dependency Parsing & Visualization with spaCy (Medium)](https://medium.com/@alshargi.usa/dependency-parsing-and-visualization-with-spacy-b419b9eda169)
- [NLP Libraries for JavaScript (Kommunicate)](https://www.kommunicate.io/blog/nlp-libraries-node-javascript/)

---

## 8. 우선 실행 권장 사항

1. **즉시 (Phase 1)**: 현재 예문(examples) 배열에 `chunks` 필드를 추가하고 CSS 색상 강조 적용. 서버 불필요, 데이터 작업만으로 가능.

2. **단기 (Phase 2)**: compromise.js CDN 추가 후 개념 탭 하단에 자동 POS 색상 뷰 구현. 초등·중등 학생 대상 시각적 흥미 극대화.

3. **중기 (Phase 3)**: 끊어읽기 경계 규칙 엔진으로 예문에 슬래시(/) 자동 삽입 + TTS speakWithChunks() 연동. 청해·읽기 통합 훈련 가능.

4. **장기 (Phase 4–5)**: spaCy/Stanza Python API를 Cloudflare Workers 또는 별도 서버로 배포해 학습자가 자유 문장을 입력하면 실시간 구문 트리를 반환하는 서술형 작문 피드백 시스템 구축.
