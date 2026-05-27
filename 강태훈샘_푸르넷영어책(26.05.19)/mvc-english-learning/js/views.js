// 푸르넷 영어 MVC 학습 프로그램의 View 계층
(function (window) {
  "use strict";

  const namespace = (window.PrunetEnglish = window.PrunetEnglish || {});

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) {
      return "기록 없음";
    }
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  class LearningView {
    constructor(model) {
      this.model = model;
      this.nodes = {
        trackCount: document.getElementById("track-count"),
        search: document.getElementById("track-search"),
        axisFilters: document.getElementById("axis-filters"),
        trackList: document.getElementById("track-list"),
        heroPanel: document.getElementById("learner-hero"),
        lessonSummary: document.getElementById("lesson-summary"),
        stageTabs: document.getElementById("stage-tabs"),
        activityArea: document.getElementById("activity-area"),
        progressDashboard: document.getElementById("progress-dashboard"),
        teacherDashboard: document.getElementById("teacher-dashboard"),
        portfolioPanel: document.getElementById("portfolio-panel"),
        modeButton: document.querySelector("[data-action='toggle-mode']")
      };
    }

    render() {
      this.renderHero();
      this.renderTracks();
      this.renderLessonSummary();
      this.renderStageTabs();
      this.renderActivity();
      this.renderDashboards();
    }

    renderHero() {
      const track = this.model.getSelectedTrack();
      const stage = this.model.getSelectedStage();
      const metrics = this.model.getDashboardMetrics();
      const specialist = this.model.getSpecialistMetrics();
      const sync = this.model.state.serverSync;
      this.nodes.heroPanel.innerHTML = `
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(track.axis)} · ${escapeHtml(track.level)}</p>
          <h2>오늘은 ${escapeHtml(track.title)}로 영어 루틴을 시작합니다</h2>
          <p>${escapeHtml(track.objective)}</p>
          <div class="hero-actions">
            <button type="button" class="primary-btn" data-action="speak-text" data-text="${escapeHtml(track.listenText)}">모델 음성 듣기</button>
            <button type="button" class="secondary-btn" data-action="complete-stage" data-stage-id="${escapeHtml(stage.id)}">${escapeHtml(stage.label)} 완료</button>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <img src="assets/learning-studio.svg" alt="" />
          <div class="floating-card hero-card-stage">
            <span>Now</span>
            <strong>${escapeHtml(stage.label)}</strong>
          </div>
          <div class="floating-card hero-card-sync">
            <span>Server</span>
            <strong>${sync.status === "synced" ? "D1 저장 완료" : "준비됨"}</strong>
          </div>
        </div>
        <div class="hero-stats" aria-label="학습 현황 요약">
          <div class="hero-stat">
            <span>트랙 완료율</span>
            <strong>${metrics.selectedCompletion}%</strong>
          </div>
          <div class="hero-stat">
            <span>학습 증거</span>
            <strong>${metrics.evidenceCount}개</strong>
          </div>
          <div class="hero-stat">
            <span>단어 인출</span>
            <strong>${specialist.wordAccuracy}%</strong>
          </div>
          <div class="hero-stat">
            <span>문법 적용</span>
            <strong>${specialist.grammarAccuracy}%</strong>
          </div>
        </div>
      `;
    }

    renderTracks() {
      const tracks = this.model.getTracks();
      const axes = this.model.getAxes();
      const selectedTrack = this.model.getSelectedTrack();
      this.nodes.trackCount.textContent = `${tracks.length}개`;
      this.nodes.search.value = this.model.state.searchQuery;
      this.nodes.axisFilters.innerHTML = axes
        .map(
          (axis) => `
            <button type="button" class="axis-btn ${axis === this.model.state.selectedAxis ? "active" : ""}" data-action="select-axis" data-axis="${escapeHtml(axis)}">
              ${escapeHtml(axis)}
            </button>
          `
        )
        .join("");
      this.nodes.trackList.innerHTML = tracks
        .map(
          (track) => {
            const completion = this.model.getCompletionPercent(track.id);
            return `
            <button type="button" class="track-btn ${track.id === selectedTrack.id ? "active" : ""}" data-action="select-track" data-track-id="${escapeHtml(track.id)}">
              <span class="track-code">${escapeHtml(track.code)}</span>
              <span>
                <span class="track-title">${escapeHtml(track.title)}</span>
                <span class="track-meta">${escapeHtml(track.axis)} · ${escapeHtml(track.level)} · ${escapeHtml(track.tesolFocus)}</span>
                <span class="track-progress" aria-label="완료율 ${completion}%"><span style="width:${completion}%"></span></span>
              </span>
            </button>
          `;
          }
        )
        .join("");
    }

    renderLessonSummary() {
      const track = this.model.getSelectedTrack();
      const metrics = this.model.getDashboardMetrics();
      this.nodes.lessonSummary.innerHTML = `
        <article class="lesson-summary">
          <div class="summary-grid">
            <div>
              <p class="eyebrow">${escapeHtml(track.axis)} · ${escapeHtml(track.db)}</p>
              <h2 class="lesson-title">${escapeHtml(track.title)}</h2>
              <p class="summary-copy">${escapeHtml(track.objective)}</p>
              <div class="meta-row">
                <span class="meta-pill">Level ${escapeHtml(track.level)}</span>
                <span class="meta-pill">TESOL ${escapeHtml(track.tesolFocus)}</span>
                <span class="meta-pill">${escapeHtml(track.canDo)}</span>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric">
                <span>현재 트랙 완료율</span>
                <strong>${metrics.selectedCompletion}%</strong>
              </div>
              <div class="metric">
                <span>학습 증거</span>
                <strong>${metrics.evidenceCount}개</strong>
              </div>
            </div>
          </div>
        </article>
      `;
    }

    renderStageTabs() {
      const track = this.model.getSelectedTrack();
      const selectedStage = this.model.getSelectedStage();
      this.nodes.stageTabs.innerHTML = this.model
        .getStageOrder()
        .map((stage) => {
          const done = this.model.isStageComplete(track.id, stage.id);
          return `
            <button type="button" class="stage-btn ${stage.id === selectedStage.id ? "active" : ""} ${done ? "done" : ""}" data-action="select-stage" data-stage-id="${escapeHtml(stage.id)}">
              ${escapeHtml(stage.label)}
            </button>
          `;
        })
        .join("");
    }

    renderActivity() {
      const stage = this.model.getSelectedStage();
      const track = this.model.getSelectedTrack();
      const content = this.getStageContent(stage.id, track);
      this.nodes.activityArea.innerHTML = `
        <article class="activity-card">
          <div class="activity-head">
            <div>
              <p class="eyebrow">TESOL Stage · ${escapeHtml(stage.id)}</p>
              <h2>${escapeHtml(stage.label)} 단계</h2>
              <p>${escapeHtml(content.summary)}</p>
            </div>
            <span class="tag">${escapeHtml(track.output)}</span>
          </div>
          ${content.body}
          ${this.renderSpecialistLab(track)}
          <p id="status-line" class="status-line" aria-live="polite"></p>
        </article>
      `;
    }

    getStageContent(stageId, track) {
      const language = track.language;
      const stageRenderers = {
        diagnose: () => ({
          summary: "학습자 수준과 오늘의 목표를 확인합니다.",
          body: `
            <div class="note-box">
              <strong>오늘의 can-do</strong>
              <p>${escapeHtml(track.canDo)}</p>
            </div>
            <div class="action-row">
              <button type="button" class="primary-btn" data-action="complete-stage" data-stage-id="diagnose">진단 완료</button>
              <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(track.objective)}">목표 듣기</button>
            </div>
          `
        }),
        prepare: () => ({
          summary: "그림, 상황, 핵심 어휘로 배경지식을 엽니다.",
          body: `
            <div class="language-grid">
              <div class="language-item"><span>핵심 상황</span>${escapeHtml(track.axis)}</div>
              <div class="language-item"><span>모델 문장</span>${escapeHtml(language.modelSentence)}</div>
              <div class="language-item"><span>예상 오류</span>${escapeHtml(language.commonErrors)}</div>
              <div class="language-item"><span>스캐폴딩</span>그림 힌트, 문장틀, 느린 음성, 다시 시도</div>
            </div>
            <div class="action-row">
              <button type="button" class="primary-btn" data-action="complete-stage" data-stage-id="prepare">준비 완료</button>
              <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(track.listenText)}">모델 음성 듣기</button>
            </div>
          `
        }),
        notice: () => ({
          summary: "언어의 form, meaning, use, pronunciation을 발견합니다.",
          body: `
            <div class="language-grid">
              <div class="language-item"><span>Form</span>${escapeHtml(language.form)}</div>
              <div class="language-item"><span>Meaning</span>${escapeHtml(language.meaning)}</div>
              <div class="language-item"><span>Use</span>${escapeHtml(language.use)}</div>
              <div class="language-item"><span>Pronunciation</span>${escapeHtml(language.pronunciation)}</div>
              <div class="language-item"><span>Appropriacy</span>${escapeHtml(language.appropriacy)}</div>
              <div class="language-item"><span>CCQ</span>${escapeHtml(language.ccq)}</div>
            </div>
            <div class="action-row">
              <button type="button" class="primary-btn" data-action="complete-stage" data-stage-id="notice">발견 완료</button>
            </div>
          `
        }),
        practice: () => this.renderPractice(track),
        communicate: () => this.renderCommunicate(track),
        feedback: () => ({
          summary: "퀴즈, 녹음, 읽기, 쓰기 증거를 보고 다음 학습을 정합니다.",
          body: `
            <p class="feedback-text">교사 피드백 기준은 정확성, 유창성, 상호작용, 자기수정, 재도전 여부입니다.</p>
            <div class="teacher-grid">
              <div class="teacher-item"><span>즉시 피드백</span>정답 여부와 모델 문장을 바로 확인합니다.</div>
              <div class="teacher-item"><span>지연 교정</span>말하기와 쓰기 오류는 활동 후 한꺼번에 정리합니다.</div>
              <div class="teacher-item"><span>다음 조치</span>${escapeHtml(track.output)}를 바탕으로 보충 또는 확장 과제를 배정합니다.</div>
            </div>
            <div class="action-row">
              <button type="button" class="primary-btn" data-action="complete-stage" data-stage-id="feedback">피드백 완료</button>
            </div>
          `
        }),
        reflect: () => ({
          summary: "학생이 오늘의 I can 문장을 확인하고 다음 복습을 예약합니다.",
          body: `
            <label>
              <span class="tag">오늘의 성찰</span>
              <textarea class="reflection-box" data-field="reflection" placeholder="오늘 내가 할 수 있게 된 영어를 적어 보세요.">${escapeHtml(this.model.state.reflectionDraft)}</textarea>
            </label>
            <div class="action-row">
              <button type="button" class="primary-btn" data-action="save-reflection">성찰 저장</button>
              <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(track.canDo)}">I can 듣기</button>
            </div>
          `
        })
      };

      return stageRenderers[stageId]();
    }

    renderPractice(track) {
      const result = this.model.state.quizResult;
      const choices = track.quiz.choices
        .map((choice, index) => {
          let stateClass = "";
          if (result && result.choiceIndex === index) {
            stateClass = result.correct ? "correct" : "wrong";
          }
          if (result && index === track.quiz.answer) {
            stateClass = "correct";
          }
          return `
            <button type="button" class="choice-btn ${stateClass}" data-action="check-quiz" data-choice-index="${index}">
              ${escapeHtml(choice)}
            </button>
          `;
        })
        .join("");
      return {
        summary: "통제 연습으로 정확성을 확인합니다.",
        body: `
          <div class="note-box">
            <strong>${escapeHtml(track.quiz.question)}</strong>
            <div class="choice-grid">${choices}</div>
          </div>
          <label>
            <span class="tag">받아쓰기 또는 핵심 문장</span>
            <textarea class="writing-box" data-field="dictation" placeholder="들은 문장이나 핵심 표현을 입력하세요.">${escapeHtml(this.model.state.dictationText)}</textarea>
          </label>
          <div class="action-row">
            <button type="button" class="primary-btn" data-action="save-dictation">받아쓰기 저장</button>
            <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(track.listenText)}">문장 듣기</button>
          </div>
        `
      };
    }

    renderCommunicate(track) {
      return {
        summary: "실제 의사소통 산출물을 남깁니다.",
        body: `
          <div class="reading-text">${escapeHtml(track.readingText)}</div>
          <div class="action-row">
            <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(track.readingText)}">읽기 모델 듣기</button>
            <button type="button" class="secondary-btn" data-action="start-reading">읽기 타이머 시작</button>
            <button type="button" class="secondary-btn" data-action="stop-reading">읽기 타이머 종료</button>
            <button type="button" class="secondary-btn" data-action="start-speaking">말하기 인식</button>
          </div>
          <p class="teacher-tip">말하기 프롬프트: ${escapeHtml(track.speakPrompt)}</p>
          <p class="teacher-tip">인식 결과: <span id="recognition-output">${escapeHtml(this.model.state.recognitionText || "아직 기록 없음")}</span></p>
          <label>
            <span class="tag">쓰기 산출물</span>
            <textarea class="writing-box" data-field="writing" placeholder="${escapeHtml(track.writingPrompt)}">${escapeHtml(this.model.state.writingDraft)}</textarea>
          </label>
          <div class="action-row">
            <button type="button" class="primary-btn" data-action="save-writing">쓰기 포트폴리오 저장</button>
            <button type="button" class="secondary-btn" data-action="save-speaking-text">말하기 텍스트 저장</button>
          </div>
        `
      };
    }

    renderSpecialistLab(track) {
      if (this.model.isVocabularyTrack(track)) {
        return this.renderVocabularyLab();
      }
      if (this.model.isGrammarTrack(track)) {
        return this.renderGrammarLab();
      }
      return "";
    }

    renderVocabularyLab() {
      const item = this.model.getCurrentVocabulary();
      const result = this.model.state.vocabularyResult;
      if (!item) {
        return "";
      }
      const choices = [item.meaning].concat(item.distractors).map((choice) => {
        let stateClass = "";
        if (result && result.choice === choice) {
          stateClass = result.correct ? "correct" : "wrong";
        }
        if (result && choice === item.meaning) {
          stateClass = "correct";
        }
        return `
          <button type="button" class="choice-btn ${stateClass}" data-action="check-vocabulary" data-choice="${escapeHtml(choice)}">
            ${escapeHtml(choice)}
          </button>
        `;
      });
      return `
        <section class="specialist-lab vocabulary-lab">
          <div class="lab-heading">
            <div>
              <p class="eyebrow">Vocabulary Self-Study Lab</p>
              <h3>${escapeHtml(item.word)} <span class="muted-text">${escapeHtml(item.partOfSpeech)} · ${escapeHtml(item.level)}</span></h3>
            </div>
            <button type="button" class="small-btn" data-action="next-vocabulary">다음 단어</button>
          </div>
          <div class="routine-steps">
            <span>문맥 노출</span>
            <span>발음·의미</span>
            <span>인출</span>
            <span>문장 사용</span>
            <span>간격 복습</span>
          </div>
          <div class="language-grid">
            <div class="language-item"><span>Context</span>${escapeHtml(item.context)}</div>
            <div class="language-item"><span>Pronunciation</span>${escapeHtml(item.pronunciation)}</div>
            <div class="language-item"><span>Collocation</span>${escapeHtml(item.collocations.join(", "))}</div>
            <div class="language-item"><span>Word Family</span>${escapeHtml(item.wordFamily.join(", "))}</div>
          </div>
          <div class="note-box">
            <strong>${escapeHtml(item.retrievalPrompt)}</strong>
            <div class="choice-grid">${choices.join("")}</div>
          </div>
          <label>
            <span class="tag">문장 산출</span>
            <textarea class="writing-box" data-field="vocabulary-production" placeholder="${escapeHtml(item.productionPrompt)}">${escapeHtml(this.model.state.vocabularyProductionDraft)}</textarea>
          </label>
          <p class="teacher-tip">${escapeHtml(item.aiLiteracyNote)}</p>
          <div class="action-row">
            <button type="button" class="primary-btn" data-action="save-vocabulary-production">단어 문장 저장</button>
            <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(item.context)}">문맥 듣기</button>
          </div>
        </section>
      `;
    }

    renderGrammarLab() {
      const pattern = this.model.getCurrentGrammar();
      const correctionResult = this.model.state.grammarCorrectionResult;
      const transformResult = this.model.state.grammarTransformResult;
      if (!pattern) {
        return "";
      }
      const correctionChoices = [pattern.correctedSentence, pattern.wrongSentence, pattern.model]
        .filter((value, index, array) => array.indexOf(value) === index)
        .map((choice) => {
          let stateClass = "";
          if (correctionResult && correctionResult.choice === choice) {
            stateClass = correctionResult.correct ? "correct" : "wrong";
          }
          if (correctionResult && choice === pattern.correctedSentence) {
            stateClass = "correct";
          }
          return `
            <button type="button" class="choice-btn ${stateClass}" data-action="check-grammar-correction" data-choice="${escapeHtml(choice)}">
              ${escapeHtml(choice)}
            </button>
          `;
        });
      return `
        <section class="specialist-lab grammar-lab">
          <div class="lab-heading">
            <div>
              <p class="eyebrow">Grammar Discovery Lab</p>
              <h3>${escapeHtml(pattern.title)} <span class="muted-text">${escapeHtml(pattern.level)}</span></h3>
            </div>
            <button type="button" class="small-btn" data-action="next-grammar">다음 문법</button>
          </div>
          <div class="routine-steps">
            <span>예문 발견</span>
            <span>FMU 분석</span>
            <span>오류 수정</span>
            <span>문장 변환</span>
            <span>자유 산출</span>
          </div>
          <div class="language-grid">
            <div class="language-item"><span>Form</span>${escapeHtml(pattern.form)}</div>
            <div class="language-item"><span>Meaning</span>${escapeHtml(pattern.meaning)}</div>
            <div class="language-item"><span>Use</span>${escapeHtml(pattern.use)}</div>
            <div class="language-item"><span>Common Error</span>${escapeHtml(pattern.commonError)}</div>
          </div>
          <div class="note-box">
            <strong>오류를 고친 문장을 고르세요.</strong>
            <p class="teacher-tip">오류 문장: ${escapeHtml(pattern.wrongSentence)}</p>
            <div class="choice-grid">${correctionChoices.join("")}</div>
          </div>
          <label>
            <span class="tag">문장 변환</span>
            <textarea class="writing-box" data-field="grammar-transform" placeholder="${escapeHtml(pattern.transformPrompt)}">${escapeHtml(this.model.state.grammarTransformDraft)}</textarea>
          </label>
          ${
            transformResult
              ? `<p class="feedback-text">${transformResult.correct ? "정확한 변환입니다." : `모델 답안: ${escapeHtml(pattern.transformAnswer)}`}</p>`
              : ""
          }
          <div class="action-row">
            <button type="button" class="primary-btn" data-action="check-grammar-transform">문장 변환 확인</button>
            <button type="button" class="secondary-btn" data-action="speak-text" data-text="${escapeHtml(pattern.model)}">모델 문장 듣기</button>
          </div>
          <label>
            <span class="tag">자유 산출</span>
            <textarea class="writing-box" data-field="grammar-production" placeholder="${escapeHtml(pattern.productionPrompt)}">${escapeHtml(this.model.state.grammarProductionDraft)}</textarea>
          </label>
          <div class="action-row">
            <button type="button" class="primary-btn" data-action="save-grammar-production">문법 산출 저장</button>
          </div>
        </section>
      `;
    }

    renderDashboards() {
      const metrics = this.model.getDashboardMetrics();
      const specialist = this.model.getSpecialistMetrics();
      const track = this.model.getSelectedTrack();
      const teacherClass = this.model.state.teacherMode ? "" : "hidden";
      const sync = this.model.state.serverSync;
      const counts = sync.counts;
      this.nodes.modeButton.setAttribute("aria-pressed", String(this.model.state.teacherMode));
      this.nodes.modeButton.textContent = this.model.state.teacherMode ? "학생용 보기" : "교사용 보기";
      this.nodes.progressDashboard.innerHTML = `
        <section class="teacher-card">
          <h2>학습 현황</h2>
          <div class="progress-bars">
            <div class="bar-row">
              <div class="bar-label"><span>${escapeHtml(track.title)}</span><span>${metrics.selectedCompletion}%</span></div>
              <div class="bar"><span style="width:${metrics.selectedCompletion}%"></span></div>
            </div>
            <div class="bar-row">
              <div class="bar-label"><span>전체 평균</span><span>${metrics.averageCompletion}%</span></div>
              <div class="bar"><span style="width:${metrics.averageCompletion}%"></span></div>
            </div>
          </div>
          <div class="cloud-sync">
            <div>
              <strong>Cloudflare D1 서버 DB</strong>
              <p class="feedback-text">${escapeHtml(this.model.getServerSyncStatus())}</p>
              ${
                counts
                  ? `<p class="feedback-text">서버 누적 기록 ${counts.events}개 · 포트폴리오 ${counts.portfolios}개 · 단어 ${counts.words}개 · 문법 ${counts.grammar}개</p>`
                  : ""
              }
            </div>
            <button type="button" class="secondary-btn" data-action="sync-server" ${sync.status === "syncing" ? "disabled" : ""}>
              ${sync.status === "syncing" ? "저장 중" : "서버 DB 저장"}
            </button>
          </div>
        </section>
      `;
      this.nodes.teacherDashboard.innerHTML = `
        <section class="teacher-card ${teacherClass}">
          <h2>교사용 TESOL 대시보드</h2>
          <div class="teacher-grid">
            <div class="teacher-item"><span>Main Aim</span>${escapeHtml(track.objective)}</div>
            <div class="teacher-item"><span>Language Analysis</span>${escapeHtml(track.language.form)} · ${escapeHtml(track.language.use)}</div>
            <div class="teacher-item"><span>Anticipated Problems</span>${escapeHtml(track.language.commonErrors)}</div>
            <div class="teacher-item"><span>Feedback Plan</span>즉시 피드백 후 말하기·쓰기 오류는 지연 교정합니다.</div>
            <div class="teacher-item"><span>Word Routine</span>${specialist.wordStudied}개 학습 · 인출 정확도 ${specialist.wordAccuracy}%</div>
            <div class="teacher-item"><span>Grammar Routine</span>${specialist.grammarStudied}개 학습 · 적용 정확도 ${specialist.grammarAccuracy}%</div>
            <div class="teacher-item"><span>Updated</span>${escapeHtml(formatDate(this.model.state.progress.updatedAt))}</div>
          </div>
        </section>
      `;
      this.nodes.portfolioPanel.innerHTML = this.renderPortfolio();
    }

    renderPortfolio() {
      const portfolio = this.model.state.progress.portfolio.slice(0, 5);
      const evidence = this.model.state.progress.evidence.slice(0, 5);
      return `
        <section class="portfolio-card">
          <h2>포트폴리오</h2>
          <div class="portfolio-list">
            ${
              portfolio.length
                ? portfolio
                    .map(
                      (item) => `
                        <div class="portfolio-item">
                          <span>${escapeHtml(item.trackTitle)} · ${escapeHtml(item.kind)} · ${escapeHtml(formatDate(item.at))}</span>
                          ${escapeHtml(item.text)}
                        </div>
                      `
                    )
                    .join("")
                : '<p class="feedback-text">아직 저장된 산출물이 없습니다.</p>'
            }
          </div>
        </section>
        <section class="portfolio-card">
          <h2>학습 증거</h2>
          <div class="portfolio-list">
            ${
              evidence.length
                ? evidence
                    .map(
                      (item) => `
                        <div class="portfolio-item">
                          <span>${escapeHtml(item.trackTitle)} · ${escapeHtml(item.stageId)} · ${escapeHtml(formatDate(item.at))}</span>
                          ${escapeHtml(item.note)}
                        </div>
                      `
                    )
                    .join("")
                : '<p class="feedback-text">퀴즈, 녹음, 쓰기, 읽기 기록이 여기에 쌓입니다.</p>'
            }
          </div>
        </section>
      `;
    }

    setStatus(message) {
      const node = document.getElementById("status-line");
      if (node) {
        node.textContent = message;
      }
    }
  }

  namespace.Views = {
    LearningView
  };
})(window);
