const profileKey = "codex-math-learner-profile";
const legacyStatsKey = "codex-math-study-stats";
const statsKeyPrefix = "codex-math-study-stats:";
const defaultLearnerId = "default-learner";
const accuracyText = document.querySelector("#accuracyText");
const attemptText = document.querySelector("#attemptText");
const updatedText = document.querySelector("#updatedText");
const installButton = document.querySelector("#installButton");
const installText = document.querySelector("#installText");

function readStats() {
  try {
    const profileRaw = localStorage.getItem(profileKey);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const learnerId = profile?.id || defaultLearnerId;
    const raw =
      localStorage.getItem(`${statsKeyPrefix}${learnerId}`) ||
      (learnerId === defaultLearnerId ? localStorage.getItem(legacyStatsKey) : null);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderStats() {
  const stats = readStats();
  if (!stats || !stats.attempted) return;
  const accuracy = Math.round((stats.correct / stats.attempted) * 100);
  accuracyText.textContent = `${accuracy}%`;
  attemptText.textContent = `${stats.correct}/${stats.attempted} 정답`;
}

function renderUpdated() {
  const date = new Date(document.lastModified);
  updatedText.textContent = `업데이트 ${date.toLocaleDateString("ko-KR")}`;
}

let deferredInstallEvent = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallEvent = event;
  installText.textContent = "버튼을 눌러 홈 화면에 추가";
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallEvent) {
    installText.textContent = "브라우저 메뉴에서 홈 화면에 추가";
    return;
  }
  deferredInstallEvent.prompt();
  await deferredInstallEvent.userChoice;
  deferredInstallEvent = null;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

renderStats();
renderUpdated();
