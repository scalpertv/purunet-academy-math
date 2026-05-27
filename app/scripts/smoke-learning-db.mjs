// 학습 DB와 회원가입·클래스·학생 관리 흐름을 브라우저에서 점검한다.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const PORT = 4174;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DB_NAME = "kang-taehoon-math-learner-db";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const runId = Date.now().toString(36);
const adminEmail = "purunetkangtaehun@gmail.com";
const googleClientId = "smoke-test.apps.googleusercontent.com";
const localAdminPin = `admin${runId}`;
const teacherId = `teacher_${runId}`;
const teacherPassword = `tpass${runId}`;
const studentId = `student_${runId}`;
const studentPassword = `spass${runId}`;
const updatedStudentPassword = `newpass${runId}`;
const teacherName = `점검 선생님 ${runId}`;
const className = `점검 6학년반 ${runId}`;
const studentName = `점검 학생 ${runId}`;
const gradeName = "6학년 연산";

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function buildFakeGoogleCredential() {
  return [
    base64UrlJson({ alg: "none", typ: "JWT" }),
    base64UrlJson({
      aud: googleClientId,
      email: adminEmail,
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      name: "Smoke Admin",
      picture: "https://example.test/admin.png",
      sub: "smoke-admin-subject",
    }),
    "signature",
  ].join(".");
}

function fail(message) {
  throw new Error(message);
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // 서버 시작 대기 중에는 연결 실패가 정상일 수 있다.
    }
    await delay(500);
  }
  fail(`Vite dev server did not become ready at ${url}`);
}

function startServer() {
  const command = `npm run dev -- --host 127.0.0.1 --port ${PORT}`;
  const child = spawn(command, {
    cwd: process.cwd(),
    env: { ...process.env, BROWSER: "none" },
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  child.once("exit", (code) => {
    if (code !== null && code !== 0) console.error(`Vite dev server exited with code ${code}`);
  });
  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    await Promise.race([once(killer, "exit"), delay(3000)]);
    return;
  }
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(3000)]);
}

async function resetBrowserStorage(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (dbName) => {
    localStorage.clear();
    sessionStorage.clear();
    await new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = resolve;
      request.onerror = resolve;
      request.onblocked = resolve;
    });
  }, DB_NAME);
  await page.reload({ waitUntil: "networkidle" });
}

async function installGoogleIdentityMock(page) {
  await page.addInitScript(({ credential }) => {
    window.__kangMathGoogleCredential = credential;
    window.google = {
      accounts: {
        id: {
          initialize(config) {
            window.__kangMathGoogleCallback = config.callback;
          },
          renderButton(parent) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Google 테스트 로그인";
            button.addEventListener("click", () => {
              window.__kangMathGoogleCallback?.({
                credential: window.__kangMathGoogleCredential,
                select_by: "btn",
              });
            });
            parent.appendChild(button);
          },
          prompt() {
            window.__kangMathGoogleCallback?.({
              credential: window.__kangMathGoogleCredential,
              select_by: "user_1tap",
            });
          },
          disableAutoSelect() {
            window.__kangMathGoogleCallback = undefined;
          },
        },
      },
    };
  }, { credential: buildFakeGoogleCredential() });
}

async function readStore(page, storeName) {
  return page.evaluate(
    async ({ dbName, storeName: targetStore }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(targetStore)) {
            db.close();
            resolve([]);
            return;
          }
          const transaction = db.transaction(targetStore, "readonly");
          const getAll = transaction.objectStore(targetStore).getAll();
          getAll.onsuccess = () => {
            const result = getAll.result;
            db.close();
            resolve(result);
          };
          getAll.onerror = () => {
            db.close();
            reject(getAll.error);
          };
        };
      }),
    { dbName: DB_NAME, storeName },
  );
}

async function clickMenu(page, label) {
  if (!(await page.locator("nav.registration-menu-bar").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /관리 메뉴/ }).click();
  }
  await page.locator("nav.registration-menu-bar").waitFor({ state: "visible", timeout: 7000 });
  await page.locator("nav.registration-menu-bar").getByRole("button", { name: label }).click();
}

async function loginAdminWithGoogle(page) {
  await clickMenu(page, "관리자 로그인");
  await page.locator("#google-client-id").fill(googleClientId);
  await page.getByRole("button", { name: "Client ID 저장" }).click();
  await page.getByRole("button", { name: "Google 테스트 로그인" }).click();
  await assertText(page, `${adminEmail} Google 인증으로 관리자 모드에 로그인했습니다.`);
}

async function setupLocalAdminPin(page) {
  await page.locator("#local-admin-display-name").fill("Smoke Local Admin");
  await page.locator("#local-admin-setup-password").fill(localAdminPin);
  await page.locator("#local-admin-setup-password-confirm").fill(localAdminPin);
  await page.locator("form.local-admin-setup-form button[type='submit']").click();
  await assertText(page, "로컬 관리자 PIN을 저장하고 관리자 모드로 로그인했습니다.");
}

async function loginAdminWithLocalPin(page) {
  await clickMenu(page, "관리자 로그인");
  await page.locator("#local-admin-login-password").fill(localAdminPin);
  await page.locator("form.local-admin-login-form button[type='submit']").click();
  await assertText(page, "로컬 관리자 PIN으로 관리자 모드에 로그인했습니다.");
}

async function loginTeacher(page) {
  await clickMenu(page, "교사용 로그인");
  await page.locator("#teacher-login-id").fill(teacherId);
  await page.locator("#teacher-login-password").fill(teacherPassword);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "교사용 관리 모드로 로그인했습니다.");
}

async function expectTeacherLoginBlocked(page) {
  await clickMenu(page, "교사용 로그인");
  await page.locator("#teacher-login-id").fill(teacherId);
  await page.locator("#teacher-login-password").fill(teacherPassword);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "교사용 계정 접근이 관리자에 의해 제한되었습니다.");
}

async function expectTeacherLoginApprovalPending(page) {
  await clickMenu(page, "교사용 로그인");
  await page.locator("#teacher-login-id").fill(teacherId);
  await page.locator("#teacher-login-password").fill(teacherPassword);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "교사용 계정은 관리자 승인 후 로그인할 수 있습니다.");
}

async function expectStudentLoginWrong(page, password) {
  await clickMenu(page, "학생용 로그인");
  await page.locator("#student-login-id").fill(studentId);
  await page.locator("#student-login-password").fill(password);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "학생용 아이디 또는 비밀번호가 맞지 않습니다.");
}

async function expectStudentLoginApprovalPending(page, password) {
  await clickMenu(page, "학생용 로그인");
  await page.locator("#student-login-id").fill(studentId);
  await page.locator("#student-login-password").fill(password);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "학생용 계정은 관리자 승인 후 로그인할 수 있습니다.");
}

async function loginStudentWithPassword(page, password) {
  await clickMenu(page, "학생용 로그인");
  await page.locator("#student-login-id").fill(studentId);
  await page.locator("#student-login-password").fill(password);
  await page.locator("form.auth-login-form button[type='submit']").click();
  await assertText(page, "학생용 학습 모드로 로그인했습니다.");
}

async function logoutRoleIfActive(page, roleLabel) {
  if (!(await page.locator("nav.registration-menu-bar").isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /관리 메뉴/ }).click();
  }
  const navLabel = `${roleLabel} 로그아웃`;
  const navButton = page.locator("nav.registration-menu-bar").getByRole("button", { name: navLabel });
  if ((await navButton.count()) === 0) return;
  await navButton.click();
  if (roleLabel === "관리자") {
    await page.locator(".admin-management-panel").getByRole("button", { name: navLabel }).click();
    await assertText(page, "관리자 계정에서 로그아웃했습니다.");
    return;
  }
  await page.locator("form.auth-login-form").getByRole("button", { name: navLabel }).click();
  await assertText(page, `${roleLabel} 계정에서 로그아웃했습니다.`);
}

async function assertText(page, text) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 7000 });
  } catch {
    const statusText = await page.locator(".mode-status-strip").innerText().catch(() => "");
    fail(`Expected visible text not found: ${text}\nCurrent status: ${statusText}`);
  }
}

async function submitSignup(page, { role, username, password, displayName }) {
  await clickMenu(page, "회원가입/약관");
  await page.locator("#signup-role").selectOption(role);
  await page.locator("#signup-id").fill(username);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-password-confirm").fill(password);
  await page.locator("#signup-display-name").fill(displayName);
  if (role === "student") {
    await page.locator("#signup-class").selectOption({ index: 1 });
    await page.locator("#signup-grade").fill(gradeName);
  }
  await page.locator(".terms-check input").check();
  await page.locator("form.signup-registration-form button[type='submit']").click();
}

async function expectStoreCount(page, storeName, count) {
  const rows = await readStore(page, storeName);
  if (rows.length !== count) fail(`${storeName} count expected ${count}, got ${rows.length}`);
  return rows;
}

async function waitForStoreCount(page, storeName, count) {
  let rows = [];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    rows = await readStore(page, storeName);
    if (rows.length === count) return rows;
    await delay(250);
  }
  fail(`${storeName} count expected ${count}, got ${rows.length}`);
}

async function approveAccount(page, username) {
  await clickMenu(page, "관리자 로그아웃");
  await assertText(page, "사용 승인 관리");
  const card = page.locator(".approval-account-card").filter({ hasText: username });
  await card.getByRole("button", { name: "승인 인증" }).click();
  await assertText(page, `${username} 계정을 승인했습니다.`);
}

async function run() {
  const server = startServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
    const page = await browser.newPage();
    await installGoogleIdentityMock(page);
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await resetBrowserStorage(page);
    await page.getByRole("button", { name: /관리 메뉴/ }).waitFor({ state: "visible", timeout: 7000 });
    if (await page.locator("nav.registration-menu-bar").isVisible().catch(() => false)) {
      fail("Management registration menu should be collapsed on the first screen.");
    }
    await page.getByText("스토리 단원 보기").click();
    await page.locator(".story-chapter-card summary").first().click();
    await assertText(page, "핵심 수식");
    await assertText(page, "목차별 탐구 미션");
    if ((await page.locator(".story-vector svg").count()) === 0) fail("STEM story vector image was not rendered.");

    await loginAdminWithGoogle(page);
    await expectStoreCount(page, "adminAccounts", 1);
    await assertText(page, "인증 정보");
    await assertText(page, "Google 로그인");
    await setupLocalAdminPin(page);
    await expectStoreCount(page, "adminAccounts", 1);
    await assertText(page, "로컬 PIN · 해시 비노출");
    await logoutRoleIfActive(page, "관리자");
    await loginAdminWithLocalPin(page);

    await submitSignup(page, {
      role: "teacher",
      username: teacherId,
      password: teacherPassword,
      displayName: teacherName,
    });
    await assertText(page, "교사용 회원가입을 완료했습니다. 관리자 승인 후 로그인할 수 있습니다.");
    await expectStoreCount(page, "teachers", 1);
    const pendingTeacherAccounts = await expectStoreCount(page, "teacherAccounts", 1);
    if (pendingTeacherAccounts[0].access?.canLogin !== false || pendingTeacherAccounts[0].access?.blockedReason !== "approval-pending") {
      fail("Teacher account should wait for admin approval before login.");
    }

    await expectTeacherLoginApprovalPending(page);
    await approveAccount(page, teacherId);
    await loginTeacher(page);

    await clickMenu(page, "클래스 등록");
    if (!(await page.locator("#class-teacher").inputValue())) {
      await page.locator("#class-teacher").selectOption({ index: 1 });
    }
    await page.locator("#class-name").fill(className);
    await page.locator("#class-grade").fill(gradeName);
    await page.locator("form.class-registration-form button[type='submit']").click();
    const classes = await waitForStoreCount(page, "classes", 1);
    if (classes[0].name !== className || classes[0].grade !== gradeName) fail("Class record was not saved correctly.");

    await clickMenu(page, "클래스 관리");
    const classCard = page.locator(".class-management-card").filter({ hasText: className });
    if ((await classCard.count()) !== 1) fail("Class management card was not found.");
    await classCard.getByRole("button", { name: "선택" }).click();
    await assertText(page, "현재 관리 대상으로 선택했습니다.");
    await clickMenu(page, "클래스 관리");
    await classCard.getByRole("button", { name: "수정" }).click();
    if ((await page.locator("#class-name").inputValue()) !== className) fail("Class edit form did not load the selected class.");

    await clickMenu(page, "클래스 관리");
    await classCard.getByRole("button", { name: "학생 추가" }).click();
    if (!(await page.locator("#student-class").inputValue())) {
      await page.locator("#student-class").selectOption({ index: 1 });
    }
    await page.locator("#student-name").fill(studentName);
    await page.locator("#student-grade").fill(gradeName);
    await page.locator("form.student-registration-form button[type='submit']").click();
    const studentsAfterManualAdd = await waitForStoreCount(page, "students", 1);
    if (studentsAfterManualAdd[0].name !== studentName) fail("Student record was not saved correctly.");

    await submitSignup(page, {
      role: "student",
      username: studentId,
      password: studentPassword,
      displayName: studentName,
    });
    await assertText(page, "학생용 회원가입을 완료했습니다. 관리자 승인 후 로그인할 수 있습니다.");
    await expectStoreCount(page, "students", 1);
    const pendingStudentAccounts = await expectStoreCount(page, "studentAccounts", 1);
    if (pendingStudentAccounts[0].access?.canLogin !== false || pendingStudentAccounts[0].access?.blockedReason !== "approval-pending") {
      fail("Student account should wait for admin approval before login.");
    }

    await expectStudentLoginApprovalPending(page, studentPassword);
    await approveAccount(page, studentId);
    await loginStudentWithPassword(page, studentPassword);
    const learnerNameValue = await page.locator("#learner-name").inputValue();
    if (learnerNameValue !== studentName) fail(`Learner name should match the logged-in student. expected=${studentName}, got=${learnerNameValue}`);
    await page.locator("#study-topic-select").selectOption({ index: 1 });

    await page.getByRole("button", { name: /선택한 목차 학습|선택한 내용 학습/ }).click();
    await page.waitForSelector(".practice-shell");
    if ((await page.locator(".choice-btn").count()) > 0) {
      await page.locator(".choice-btn").first().click();
    } else {
      await page.locator(".answer-input").fill("0");
      await page.getByRole("button", { name: "정답 입력" }).click();
    }
    await page.waitForSelector(".feedback");

    const attempts = await expectStoreCount(page, "attempts", 1);
    if (attempts[0].learnerName !== studentName) fail("Attempt was not connected to the active student.");
    if (!attempts[0].className || attempts[0].className !== className) fail("Attempt was not connected to the active class.");

    if (!(await page.locator("nav.registration-menu-bar").isVisible().catch(() => false))) {
      await page.locator("button[aria-label='단원 선택으로 돌아가기']").click();
    }
    await page.getByRole("button", { name: /관리 메뉴/ }).waitFor({ state: "visible", timeout: 7000 });
    if ((await page.getByRole("button", { name: "텔레그램 보내기" }).count()) > 0) fail("Telegram share button should not be visible.");
    if ((await page.getByRole("button", { name: "카카오톡 보내기" }).count()) > 0) fail("KakaoTalk share button should not be visible.");
    await assertText(page, "학생별 학습 진단서와 학부모 상담서");
    await assertText(page, "학부모 상담서");

    await page.getByRole("button", { name: "계정·진도 수정" }).first().click();
    await page.locator("#student-account-username").fill(studentId);
    await page.locator("#student-account-password").fill(updatedStudentPassword);
    await page.locator("#student-account-password-confirm").fill(updatedStudentPassword);
    await page.locator("#student-progress-attempted").fill("7");
    await page.locator("#student-progress-correct").fill("5");
    await page.locator("form.student-registration-form button[type='submit']").click();
    await assertText(page, "학생 진도를 수정했습니다.");
    await expectStoreCount(page, "studentAccounts", 1);
    const progressOverrides = await expectStoreCount(page, "studentProgressOverrides", 1);
    if (progressOverrides[0].attempted !== 7 || progressOverrides[0].correct !== 5) {
      fail("Student progress override was not saved correctly.");
    }

    await clickMenu(page, "학생용 로그아웃");
    await page.locator("form.auth-login-form").getByRole("button", { name: "학생용 로그아웃" }).click();
    await assertText(page, "학생용 계정에서 로그아웃했습니다.");
    await loginStudentWithPassword(page, updatedStudentPassword);

    await clickMenu(page, "관리자 로그아웃");
    await assertText(page, "접근 권한");
    await assertText(page, "해시 비노출");
    await page.locator(".account-access-card").filter({ hasText: teacherId }).getByRole("button", { name: "관리자 대리 사용" }).click();
    await assertText(page, `${teacherId} 계정을 관리자 권한으로 대리 사용합니다.`);
    await page.locator(".account-access-card").filter({ hasText: studentId }).getByRole("button", { name: "관리자 대리 사용" }).click();
    await assertText(page, `${studentId} 계정을 관리자 권한으로 대리 사용합니다.`);
    await logoutRoleIfActive(page, "학생용");
    for (let i = 0; i < 5; i += 1) {
      await expectStudentLoginWrong(page, `wrong${i}${runId}`);
    }
    await clickMenu(page, "관리자 로그아웃");
    await assertText(page, "자동 제한 알림");
    await assertText(page, "반복 로그인 실패");
    await assertText(page, "카카오톡 문구 복사");
    await page.locator(".account-access-card").filter({ hasText: studentId }).getByRole("button", { name: "전체 허용" }).click();
    await assertText(page, `${studentId} 계정 접근 권한을 저장했습니다.`);
    await loginStudentWithPassword(page, updatedStudentPassword);
    await clickMenu(page, "관리자 로그아웃");
    await page.locator(".account-access-card").filter({ hasText: studentId }).getByRole("button", { name: "학습 차단" }).click();
    await assertText(page, `${studentId} 계정 접근 권한을 저장했습니다.`);
    await page.locator("#study-topic-select").selectOption({ index: 1 });
    await page.getByRole("button", { name: /선택한 내용 학습|선택한 목차 학습|선택한 단원 학습/ }).click();
    await assertText(page, "관리자가 현재 계정의 학습 실행 권한을 제한했습니다.");
    await clickMenu(page, "관리자 로그아웃");
    await page.locator(".account-access-card").filter({ hasText: studentId }).getByRole("button", { name: "전체 허용" }).click();
    await assertText(page, `${studentId} 계정 접근 권한을 저장했습니다.`);

    await page.locator(".account-access-card").filter({ hasText: teacherId }).getByRole("button", { name: "학습 데이터 차단" }).click();
    await assertText(page, `${teacherId} 계정 접근 권한을 저장했습니다.`);
    await logoutRoleIfActive(page, "학생용");
    await logoutRoleIfActive(page, "관리자");
    await assertText(page, "관리자가 현재 교사용 계정의 학생 학습 데이터 조회 권한을 제한했습니다.");
    await loginAdminWithGoogle(page);
    await clickMenu(page, "관리자 로그아웃");
    await page.locator(".account-access-card").filter({ hasText: teacherId }).getByRole("button", { name: "전체 허용" }).click();
    await assertText(page, `${teacherId} 계정 접근 권한을 저장했습니다.`);

    await page.locator(".account-access-card").filter({ hasText: teacherId }).getByRole("button", { name: "계정 차단" }).click();
    await assertText(page, `${teacherId} 계정 접근 권한을 저장했습니다.`);
    await expectTeacherLoginBlocked(page);
    await clickMenu(page, "관리자 로그아웃");
    await page.locator(".account-access-card").filter({ hasText: teacherId }).getByRole("button", { name: "전체 허용" }).click();
    await assertText(page, `${teacherId} 계정 접근 권한을 저장했습니다.`);

    await logoutRoleIfActive(page, "학생용");
    await logoutRoleIfActive(page, "관리자");
    await logoutRoleIfActive(page, "교사용");
    await loginTeacher(page);
    await assertText(page, "전체 학습자 실시간 진도맵");
    await assertText(page, "교사용 전체");
    await assertText(page, "최근 학습 데이터");
    await assertText(page, studentName);
    await assertText(page, className);
    await page.locator("#study-topic-select").selectOption({ index: 1 });
    await page.getByRole("button", { name: /선택한 내용 학습|선택한 목차 학습|선택한 단원 학습/ }).click();
    await page.waitForSelector(".practice-shell");

    if (consoleErrors.length) fail(`Browser console errors found: ${consoleErrors.join(" | ")}`);

    console.log("SMOKE PASSED");
    console.log(JSON.stringify({
      adminAccounts: 1,
      teachers: 1,
      classes: 1,
      students: 1,
      teacherAccounts: 1,
      studentAccounts: 1,
      progressOverrides: 1,
      attempts: 1,
      learnerName: attempts[0].learnerName,
      className: attempts[0].className,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    await stopServer(server);
  }
}

await run();
