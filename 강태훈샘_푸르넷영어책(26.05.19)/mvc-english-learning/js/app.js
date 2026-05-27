// 푸르넷 영어 MVC 학습 프로그램을 초기화하는 부트스트랩 스크립트
(function (window) {
  "use strict";

  window.addEventListener("DOMContentLoaded", () => {
    const namespace = window.PrunetEnglish;
    const model = new namespace.Models.LearningModel(window.PrunetEnglishData);
    const view = new namespace.Views.LearningView(model);
    new namespace.Controllers.LearningController(model, view);
    view.render();
  });
})(window);
