// 푸르넷 영어 MVC 학습 프로그램의 Model 계층
(function (window) {
  "use strict";

  const namespace = (window.PrunetEnglish = window.PrunetEnglish || {});
  const STORAGE_KEY = "prunetEnglishMvcProgress.v1";

  function formatSyncDate(value) {
    if (!value) {
      return "아직 없음";
    }
    return new Date(value).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  class LearningModel {
    constructor(data) {
      this.data = data;
      this.state = {
        selectedTrackId: data.tracks[0].id,
        selectedStageId: data.stageOrder[0].id,
        selectedAxis: "전체",
        searchQuery: "",
        teacherMode: false,
        quizResult: null,
        dictationText: "",
        writingDraft: "",
        reflectionDraft: "",
        vocabularyProductionDraft: "",
        grammarTransformDraft: "",
        grammarProductionDraft: "",
        readingStartedAt: null,
        readingSeconds: 0,
        recognitionText: "",
        selectedVocabularyIndex: 0,
        selectedGrammarIndex: 0,
        vocabularyResult: null,
        grammarCorrectionResult: null,
        grammarTransformResult: null,
        progress: this.loadProgress(),
        serverSync: {
          status: "idle",
          lastSyncedAt: null,
          error: "",
          counts: null
        }
      };
    }

    loadProgress() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return this.createEmptyProgress();
        }
        return Object.assign(this.createEmptyProgress(), JSON.parse(stored));
      } catch (error) {
        return this.createEmptyProgress();
      }
    }

    createEmptyProgress() {
      return {
        completedStages: {},
        scores: {},
        evidence: [],
        portfolio: [],
        reflections: [],
        wordMastery: {},
        grammarMastery: {},
        updatedAt: null
      };
    }

    saveProgress() {
      this.state.progress.updatedAt = new Date().toISOString();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.progress));
    }

    resetProgress() {
      this.state.progress = this.createEmptyProgress();
      this.state.serverSync = {
        status: "idle",
        lastSyncedAt: null,
        error: "",
        counts: null
      };
      this.state.quizResult = null;
      this.state.dictationText = "";
      this.state.writingDraft = "";
      this.state.reflectionDraft = "";
      this.state.vocabularyProductionDraft = "";
      this.state.grammarTransformDraft = "";
      this.state.grammarProductionDraft = "";
      this.state.readingSeconds = 0;
      this.state.recognitionText = "";
      this.state.vocabularyResult = null;
      this.state.grammarCorrectionResult = null;
      this.state.grammarTransformResult = null;
      this.saveProgress();
    }

    getLearnerId() {
      return "local-demo";
    }

    getServerSyncStatus() {
      const sync = this.state.serverSync;
      if (sync.status === "syncing") {
        return "Cloudflare D1 서버 DB에 저장 중입니다.";
      }
      if (sync.status === "synced") {
        return `Cloudflare D1 서버 DB 동기화 완료 · ${formatSyncDate(sync.lastSyncedAt)}`;
      }
      if (sync.status === "error") {
        return `Cloudflare D1 서버 DB 동기화 실패 · ${sync.error}`;
      }
      return "Cloudflare Pages 운영 주소에서 서버 DB 동기화를 실행할 수 있습니다.";
    }

    async syncServerProgress() {
      this.state.serverSync = {
        status: "syncing",
        lastSyncedAt: this.state.serverSync.lastSyncedAt,
        error: "",
        counts: this.state.serverSync.counts
      };

      try {
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            learnerId: this.getLearnerId(),
            progress: this.state.progress
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || `HTTP ${response.status}`);
        }
        this.state.serverSync = {
          status: "synced",
          lastSyncedAt: payload.syncedAt,
          error: "",
          counts: payload.counts || null
        };
        return payload;
      } catch (error) {
        this.state.serverSync = {
          status: "error",
          lastSyncedAt: this.state.serverSync.lastSyncedAt,
          error: error.message,
          counts: this.state.serverSync.counts
        };
        throw error;
      }
    }

    getTracks() {
      const query = this.state.searchQuery.trim().toLowerCase();
      return this.data.tracks.filter((track) => {
        const axisOk = this.state.selectedAxis === "전체" || track.axis === this.state.selectedAxis;
        const text = `${track.title} ${track.db} ${track.axis} ${track.tesolFocus}`.toLowerCase();
        return axisOk && (!query || text.includes(query));
      });
    }

    getAxes() {
      return ["전체"].concat(this.data.axes);
    }

    getSelectedTrack() {
      return this.data.tracks.find((track) => track.id === this.state.selectedTrackId) || this.data.tracks[0];
    }

    getSelectedStage() {
      return this.data.stageOrder.find((stage) => stage.id === this.state.selectedStageId) || this.data.stageOrder[0];
    }

    getStageOrder() {
      return this.data.stageOrder.slice();
    }

    selectTrack(trackId) {
      if (!this.data.tracks.some((track) => track.id === trackId)) {
        return;
      }
      this.state.selectedTrackId = trackId;
      this.state.selectedStageId = "diagnose";
      this.state.quizResult = null;
      this.state.dictationText = "";
      this.state.writingDraft = "";
      this.state.reflectionDraft = "";
      this.state.readingSeconds = 0;
      this.state.recognitionText = "";
    }

    selectStage(stageId) {
      if (this.data.stageOrder.some((stage) => stage.id === stageId)) {
        this.state.selectedStageId = stageId;
      }
    }

    setAxis(axis) {
      this.state.selectedAxis = axis;
    }

    setSearch(query) {
      this.state.searchQuery = query;
    }

    toggleTeacherMode() {
      this.state.teacherMode = !this.state.teacherMode;
    }

    setDictation(text) {
      this.state.dictationText = text;
    }

    setWritingDraft(text) {
      this.state.writingDraft = text;
    }

    setVocabularyProductionDraft(text) {
      this.state.vocabularyProductionDraft = text;
    }

    setGrammarTransformDraft(text) {
      this.state.grammarTransformDraft = text;
    }

    setGrammarProductionDraft(text) {
      this.state.grammarProductionDraft = text;
    }

    setReflectionDraft(text) {
      this.state.reflectionDraft = text;
    }

    setRecognitionText(text) {
      this.state.recognitionText = text;
    }

    markStageComplete(stageId, evidenceType, note, score) {
      const track = this.getSelectedTrack();
      const key = this.getStageKey(track.id, stageId);
      this.state.progress.completedStages[key] = true;
      if (typeof score === "number") {
        this.state.progress.scores[track.id] = Math.max(this.state.progress.scores[track.id] || 0, score);
      }
      this.state.progress.evidence.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        trackId: track.id,
        trackTitle: track.title,
        stageId,
        evidenceType,
        note,
        score: score || 0
      });
      this.state.progress.evidence = this.state.progress.evidence.slice(0, 40);
      this.saveProgress();
    }

    getStageKey(trackId, stageId) {
      return `${trackId}:${stageId}`;
    }

    isStageComplete(trackId, stageId) {
      return Boolean(this.state.progress.completedStages[this.getStageKey(trackId, stageId)]);
    }

    checkQuiz(choiceIndex) {
      const track = this.getSelectedTrack();
      const correct = Number(choiceIndex) === track.quiz.answer;
      this.state.quizResult = {
        choiceIndex: Number(choiceIndex),
        correct
      };
      this.markStageComplete("practice", "quiz", correct ? "정답을 맞혔습니다." : "오답을 확인했습니다.", correct ? 100 : 40);
      return correct;
    }

    isVocabularyTrack(track) {
      const target = track || this.getSelectedTrack();
      return target.id === "elementary-vocabulary" || target.id === "middle-vocabulary";
    }

    isGrammarTrack(track) {
      const target = track || this.getSelectedTrack();
      return target.id === "elementary-grammar" || target.id === "middle-grammar";
    }

    getCurrentVocabulary() {
      const bank = this.data.vocabularyBank || [];
      if (!bank.length) {
        return null;
      }
      return bank[this.state.selectedVocabularyIndex % bank.length];
    }

    getCurrentGrammar() {
      const patterns = this.data.grammarPatterns || [];
      if (!patterns.length) {
        return null;
      }
      return patterns[this.state.selectedGrammarIndex % patterns.length];
    }

    nextVocabulary() {
      const bank = this.data.vocabularyBank || [];
      if (!bank.length) {
        return;
      }
      this.state.selectedVocabularyIndex = (this.state.selectedVocabularyIndex + 1) % bank.length;
      this.state.vocabularyResult = null;
      this.state.vocabularyProductionDraft = "";
    }

    nextGrammar() {
      const patterns = this.data.grammarPatterns || [];
      if (!patterns.length) {
        return;
      }
      this.state.selectedGrammarIndex = (this.state.selectedGrammarIndex + 1) % patterns.length;
      this.state.grammarCorrectionResult = null;
      this.state.grammarTransformResult = null;
      this.state.grammarTransformDraft = "";
      this.state.grammarProductionDraft = "";
    }

    checkVocabulary(choice) {
      const item = this.getCurrentVocabulary();
      if (!item) {
        return false;
      }
      const correct = choice === item.meaning;
      this.state.vocabularyResult = { choice, correct };
      const current = this.state.progress.wordMastery[item.id] || { attempts: 0, correct: 0, production: 0 };
      current.attempts += 1;
      current.correct += correct ? 1 : 0;
      current.lastReviewedAt = new Date().toISOString();
      current.nextReviewHint = correct ? "내일 문장 산출로 재확인" : "오늘 다시 인출";
      this.state.progress.wordMastery[item.id] = current;
      this.markStageComplete("practice", "vocabulary-retrieval", `${item.word}: ${choice}`, correct ? 100 : 45);
      return correct;
    }

    saveVocabularyProduction(text) {
      const item = this.getCurrentVocabulary();
      const cleanText = text.trim();
      if (!item || !cleanText) {
        return false;
      }
      const includesWord = cleanText.toLowerCase().includes(item.word.toLowerCase());
      const current = this.state.progress.wordMastery[item.id] || { attempts: 0, correct: 0, production: 0 };
      current.production += 1;
      current.lastProductionAt = new Date().toISOString();
      current.nextReviewHint = includesWord ? "3일 뒤 누적 복습" : "단어를 넣어 다시 쓰기";
      this.state.progress.wordMastery[item.id] = current;
      this.savePortfolio("vocabulary-sentence", `${item.word}: ${cleanText}`, "communicate");
      return includesWord;
    }

    checkGrammarCorrection(choice) {
      const pattern = this.getCurrentGrammar();
      if (!pattern) {
        return false;
      }
      const correct = choice === pattern.correctedSentence;
      this.state.grammarCorrectionResult = { choice, correct };
      const current = this.state.progress.grammarMastery[pattern.id] || { attempts: 0, correct: 0, production: 0 };
      current.attempts += 1;
      current.correct += correct ? 1 : 0;
      current.lastReviewedAt = new Date().toISOString();
      current.nextReviewHint = correct ? "문장 변환으로 확장" : "form 분석 다시 확인";
      this.state.progress.grammarMastery[pattern.id] = current;
      this.markStageComplete("practice", "grammar-correction", `${pattern.title}: ${choice}`, correct ? 100 : 45);
      return correct;
    }

    checkGrammarTransform(text) {
      const pattern = this.getCurrentGrammar();
      const cleanText = text.trim().replace(/\s+/g, " ");
      if (!pattern || !cleanText) {
        return false;
      }
      const expected = pattern.transformAnswer.toLowerCase().replace(/[.?!]/g, "");
      const submitted = cleanText.toLowerCase().replace(/[.?!]/g, "");
      const correct = submitted === expected;
      this.state.grammarTransformResult = { text: cleanText, correct };
      const current = this.state.progress.grammarMastery[pattern.id] || { attempts: 0, correct: 0, production: 0 };
      current.attempts += 1;
      current.correct += correct ? 1 : 0;
      current.lastTransformAt = new Date().toISOString();
      current.nextReviewHint = correct ? "자유 산출로 확장" : "모델 문장 보고 다시 변환";
      this.state.progress.grammarMastery[pattern.id] = current;
      this.markStageComplete("practice", "grammar-transform", `${pattern.title}: ${cleanText}`, correct ? 100 : 50);
      return correct;
    }

    saveGrammarProduction(text) {
      const pattern = this.getCurrentGrammar();
      const cleanText = text.trim();
      if (!pattern || !cleanText) {
        return false;
      }
      const current = this.state.progress.grammarMastery[pattern.id] || { attempts: 0, correct: 0, production: 0 };
      current.production += 1;
      current.lastProductionAt = new Date().toISOString();
      current.nextReviewHint = "다음 수업에서 말하기 또는 쓰기 재사용";
      this.state.progress.grammarMastery[pattern.id] = current;
      this.savePortfolio("grammar-production", `${pattern.title}: ${cleanText}`, "communicate");
      return true;
    }

    savePortfolio(kind, text, stageId) {
      const track = this.getSelectedTrack();
      const cleanText = text.trim();
      if (!cleanText) {
        return false;
      }
      this.state.progress.portfolio.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        trackId: track.id,
        trackTitle: track.title,
        kind,
        text: cleanText
      });
      this.state.progress.portfolio = this.state.progress.portfolio.slice(0, 30);
      this.markStageComplete(stageId || "communicate", kind, cleanText, 80);
      this.saveProgress();
      return true;
    }

    saveReflection(text) {
      const track = this.getSelectedTrack();
      const cleanText = text.trim();
      if (!cleanText) {
        return false;
      }
      this.state.progress.reflections.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: new Date().toISOString(),
        trackId: track.id,
        trackTitle: track.title,
        text: cleanText
      });
      this.state.progress.reflections = this.state.progress.reflections.slice(0, 30);
      this.markStageComplete("reflect", "student-reflection", cleanText, 90);
      return true;
    }

    getCompletionPercent(trackId) {
      const completed = this.data.stageOrder.filter((stage) => this.isStageComplete(trackId, stage.id)).length;
      return Math.round((completed / this.data.stageOrder.length) * 100);
    }

    getDashboardMetrics() {
      const selectedTrack = this.getSelectedTrack();
      const completedTracks = this.data.tracks.filter((track) => this.getCompletionPercent(track.id) > 0).length;
      const averageCompletion = Math.round(
        this.data.tracks.reduce((sum, track) => sum + this.getCompletionPercent(track.id), 0) / this.data.tracks.length
      );
      return {
        selectedCompletion: this.getCompletionPercent(selectedTrack.id),
        completedTracks,
        averageCompletion,
        evidenceCount: this.state.progress.evidence.length,
        portfolioCount: this.state.progress.portfolio.length
      };
    }

    getSpecialistMetrics() {
      const wordItems = Object.values(this.state.progress.wordMastery || {});
      const grammarItems = Object.values(this.state.progress.grammarMastery || {});
      const wordAttempts = wordItems.reduce((sum, item) => sum + item.attempts, 0);
      const wordCorrect = wordItems.reduce((sum, item) => sum + item.correct, 0);
      const grammarAttempts = grammarItems.reduce((sum, item) => sum + item.attempts, 0);
      const grammarCorrect = grammarItems.reduce((sum, item) => sum + item.correct, 0);
      return {
        wordStudied: wordItems.length,
        wordAccuracy: wordAttempts ? Math.round((wordCorrect / wordAttempts) * 100) : 0,
        grammarStudied: grammarItems.length,
        grammarAccuracy: grammarAttempts ? Math.round((grammarCorrect / grammarAttempts) * 100) : 0
      };
    }

    startReadingTimer() {
      if (!this.state.readingStartedAt) {
        this.state.readingStartedAt = Date.now();
      }
    }

    stopReadingTimer() {
      if (!this.state.readingStartedAt) {
        return this.state.readingSeconds;
      }
      const elapsed = Math.round((Date.now() - this.state.readingStartedAt) / 1000);
      this.state.readingSeconds += elapsed;
      this.state.readingStartedAt = null;
      this.markStageComplete("communicate", "reading-timer", `${this.state.readingSeconds}초 소리내어 읽기`, 75);
      return this.state.readingSeconds;
    }
  }

  namespace.Models = {
    LearningModel
  };
})(window);
