// 푸르넷 영어 MVC 학습 프로그램의 Controller 계층
(function (window) {
  "use strict";

  const namespace = (window.PrunetEnglish = window.PrunetEnglish || {});

  class LearningController {
    constructor(model, view) {
      this.model = model;
      this.view = view;
      this.recognition = null;
      this.bindEvents();
    }

    bindEvents() {
      document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-action]");
        if (!trigger) {
          return;
        }
        const action = trigger.dataset.action;
        this.handleAction(action, trigger);
      });

      document.addEventListener("input", (event) => {
        const field = event.target.dataset.field;
        if (field === "dictation") {
          this.model.setDictation(event.target.value);
        }
        if (field === "writing") {
          this.model.setWritingDraft(event.target.value);
        }
        if (field === "vocabulary-production") {
          this.model.setVocabularyProductionDraft(event.target.value);
        }
        if (field === "grammar-transform") {
          this.model.setGrammarTransformDraft(event.target.value);
        }
        if (field === "grammar-production") {
          this.model.setGrammarProductionDraft(event.target.value);
        }
        if (field === "reflection") {
          this.model.setReflectionDraft(event.target.value);
        }
      });

      const search = document.getElementById("track-search");
      search.addEventListener("input", (event) => {
        this.model.setSearch(event.target.value);
        this.view.renderTracks();
      });
    }

    handleAction(action, trigger) {
      const actions = {
        "select-track": () => this.selectTrack(trigger.dataset.trackId),
        "select-stage": () => this.selectStage(trigger.dataset.stageId),
        "select-axis": () => this.selectAxis(trigger.dataset.axis),
        "toggle-mode": () => this.toggleMode(),
        "reset-progress": () => this.resetProgress(),
        "complete-stage": () => this.completeStage(trigger.dataset.stageId),
        "speak-text": () => this.speakText(trigger.dataset.text),
        "check-quiz": () => this.checkQuiz(trigger.dataset.choiceIndex),
        "save-dictation": () => this.saveDictation(),
        "save-writing": () => this.saveWriting(),
        "save-speaking-text": () => this.saveSpeakingText(),
        "save-reflection": () => this.saveReflection(),
        "start-reading": () => this.startReading(),
        "stop-reading": () => this.stopReading(),
        "start-speaking": () => this.startSpeaking(),
        "check-vocabulary": () => this.checkVocabulary(trigger.dataset.choice),
        "save-vocabulary-production": () => this.saveVocabularyProduction(),
        "next-vocabulary": () => this.nextVocabulary(),
        "check-grammar-correction": () => this.checkGrammarCorrection(trigger.dataset.choice),
        "check-grammar-transform": () => this.checkGrammarTransform(),
        "save-grammar-production": () => this.saveGrammarProduction(),
        "next-grammar": () => this.nextGrammar(),
        "sync-server": () => this.syncServer()
      };

      if (actions[action]) {
        actions[action]();
      }
    }

    selectTrack(trackId) {
      this.model.selectTrack(trackId);
      this.view.render();
    }

    selectStage(stageId) {
      this.model.selectStage(stageId);
      this.view.render();
    }

    selectAxis(axis) {
      this.model.setAxis(axis);
      this.view.renderTracks();
    }

    toggleMode() {
      this.model.toggleTeacherMode();
      this.view.renderDashboards();
    }

    resetProgress() {
      const ok = window.confirm("현재 브라우저에 저장된 영어 학습 기록을 초기화할까요?");
      if (!ok) {
        return;
      }
      this.model.resetProgress();
      this.view.render();
      this.view.setStatus("학습 기록을 초기화했습니다.");
    }

    completeStage(stageId) {
      this.model.markStageComplete(stageId, "manual-check", "교사 또는 학생이 단계 완료를 확인했습니다.", 70);
      this.view.render();
      this.view.setStatus("단계를 완료 처리했습니다.");
    }

    speakText(text) {
      if (!("speechSynthesis" in window)) {
        this.view.setStatus("이 브라우저에서는 음성 합성을 지원하지 않습니다.");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.86;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      this.model.markStageComplete(this.model.state.selectedStageId, "tts-listening", "모델 음성을 들었습니다.", 60);
      this.view.renderHero();
      this.view.renderStageTabs();
      this.view.renderDashboards();
      this.view.setStatus("모델 음성을 재생했습니다.");
    }

    checkQuiz(choiceIndex) {
      const correct = this.model.checkQuiz(choiceIndex);
      this.view.render();
      this.view.setStatus(correct ? "정답입니다. 다음 단계로 넘어가세요." : "오답입니다. 정답 근거를 다시 확인하세요.");
    }

    saveDictation() {
      const text = this.model.state.dictationText.trim();
      if (!text) {
        this.view.setStatus("받아쓰기나 핵심 문장을 먼저 입력하세요.");
        return;
      }
      this.model.savePortfolio("dictation", text, "practice");
      this.view.render();
      this.view.setStatus("받아쓰기 기록을 저장했습니다.");
    }

    saveWriting() {
      const text = this.model.state.writingDraft.trim();
      if (!this.model.savePortfolio("writing", text)) {
        this.view.setStatus("쓰기 산출물을 먼저 입력하세요.");
        return;
      }
      this.model.setWritingDraft("");
      this.view.render();
      this.view.setStatus("쓰기 포트폴리오를 저장했습니다.");
    }

    saveSpeakingText() {
      const text = this.model.state.recognitionText.trim();
      if (!text) {
        this.view.setStatus("말하기 인식 결과가 없으면 쓰기 칸에 말한 내용을 적어 저장하세요.");
        return;
      }
      this.model.savePortfolio("speaking", text);
      this.view.render();
      this.view.setStatus("말하기 텍스트를 포트폴리오에 저장했습니다.");
    }

    saveReflection() {
      const text = this.model.state.reflectionDraft.trim();
      if (!this.model.saveReflection(text)) {
        this.view.setStatus("성찰 내용을 먼저 입력하세요.");
        return;
      }
      this.model.setReflectionDraft("");
      this.view.render();
      this.view.setStatus("성찰을 저장했습니다.");
    }

    startReading() {
      this.model.startReadingTimer();
      this.view.setStatus("읽기 타이머를 시작했습니다.");
    }

    stopReading() {
      const seconds = this.model.stopReadingTimer();
      this.view.render();
      this.view.setStatus(`${seconds}초 읽기 기록을 저장했습니다.`);
    }

    startSpeaking() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.view.setStatus("이 브라우저는 말하기 인식을 지원하지 않습니다. 쓰기 칸에 말한 내용을 입력해 저장하세요.");
        return;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.lang = "en-US";
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        this.model.setRecognitionText(text);
        this.model.markStageComplete("communicate", "speech-recognition", text, 80);
        this.view.render();
        this.view.setStatus("말하기 인식 결과를 저장했습니다.");
      };
      this.recognition.onerror = () => {
        this.view.setStatus("말하기 인식에 실패했습니다. 마이크 권한을 확인하거나 텍스트로 저장하세요.");
      };
      this.recognition.start();
      this.view.setStatus("말하기 인식을 시작했습니다.");
    }

    checkVocabulary(choice) {
      const correct = this.model.checkVocabulary(choice);
      this.view.render();
      this.view.setStatus(correct ? "단어 뜻 인출에 성공했습니다." : "뜻을 다시 확인하고 한 번 더 인출하세요.");
    }

    saveVocabularyProduction() {
      const text = this.model.state.vocabularyProductionDraft;
      const includesWord = this.model.saveVocabularyProduction(text);
      if (!text.trim()) {
        this.view.setStatus("단어를 넣은 문장을 먼저 작성하세요.");
        return;
      }
      this.model.setVocabularyProductionDraft("");
      this.view.render();
      this.view.setStatus(includesWord ? "단어 문장 산출물을 저장했습니다." : "문장은 저장했습니다. 다음에는 목표 단어를 꼭 넣어 보세요.");
    }

    nextVocabulary() {
      this.model.nextVocabulary();
      this.view.render();
      this.view.setStatus("다음 단어로 이동했습니다.");
    }

    checkGrammarCorrection(choice) {
      const correct = this.model.checkGrammarCorrection(choice);
      this.view.render();
      this.view.setStatus(correct ? "오류 수정에 성공했습니다." : "form과 common error를 다시 확인하세요.");
    }

    checkGrammarTransform() {
      const correct = this.model.checkGrammarTransform(this.model.state.grammarTransformDraft);
      if (!this.model.state.grammarTransformDraft.trim()) {
        this.view.setStatus("변환 문장을 먼저 입력하세요.");
        return;
      }
      this.view.render();
      this.view.setStatus(correct ? "문장 변환에 성공했습니다." : "모델 답안을 보고 다시 변환해 보세요.");
    }

    saveGrammarProduction() {
      const ok = this.model.saveGrammarProduction(this.model.state.grammarProductionDraft);
      if (!ok) {
        this.view.setStatus("문법 패턴을 사용한 자유 문장을 먼저 입력하세요.");
        return;
      }
      this.model.setGrammarProductionDraft("");
      this.view.render();
      this.view.setStatus("문법 자유 산출물을 저장했습니다.");
    }

    nextGrammar() {
      this.model.nextGrammar();
      this.view.render();
      this.view.setStatus("다음 문법 패턴으로 이동했습니다.");
    }

    async syncServer() {
      this.view.setStatus("Cloudflare D1 서버 DB 동기화를 시작했습니다.");
      try {
        const syncTask = this.model.syncServerProgress();
        this.view.renderHero();
        this.view.renderDashboards();
        const result = await syncTask;
        this.view.renderHero();
        this.view.renderDashboards();
        this.view.setStatus(`Cloudflare D1 서버 DB에 ${result.insertedStatements}개 기록을 동기화했습니다.`);
      } catch (error) {
        this.view.renderHero();
        this.view.renderDashboards();
        this.view.setStatus(`Cloudflare D1 서버 DB 동기화에 실패했습니다. ${error.message}`);
      }
    }
  }

  namespace.Controllers = {
    LearningController
  };
})(window);
