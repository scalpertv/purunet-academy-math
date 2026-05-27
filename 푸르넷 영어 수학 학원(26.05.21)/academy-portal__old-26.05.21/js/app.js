// 푸르넷 영어 수학 통합 학습 앱의 화면 렌더링, 진도 저장, 3D 학습 환경 로직
(function () {
  'use strict';

  const DATA = window.PurunetAcademyData;
  const STORAGE_KEY = 'purunet-academy-learning-app-v2';
  const roleLabels = { signup: '회원가입', student: '학생용', teacher: '교사용', admin: '관리자' };

  const state = loadState();
  const sceneApi = createAcademyScene();

  function loadState() {
    const defaults = {
      role: 'student',
      subject: 'math',
      courseId: 'math-g1-concept',
      lessonId: 'math-g1-concept-01',
      cardIndex: 0,
      selectedAnswer: '',
      feedback: '',
      learnerName: '푸르넷 학습자',
      progress: {},
      users: []
    };
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      return { ...defaults, ...(parsed || {}), progress: parsed?.progress || {}, users: parsed?.users || [] };
    } catch (err) {
      return defaults;
    }
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === 'class') node.className = value;
      else if (key === 'style') node.setAttribute('style', value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, '');
      else if (value === false || value == null) return;
      else node.setAttribute(key, String(value));
    });
    (children || []).forEach((child) => {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function coursesForSubject() {
    if (state.subject === 'all') return DATA.courses;
    return DATA.courses.filter((course) => course.subject === state.subject);
  }

  function activeCourse() {
    return DATA.courses.find((course) => course.id === state.courseId) || coursesForSubject()[0] || DATA.courses[0];
  }

  function activeLesson() {
    const course = activeCourse();
    return course.lessons.find((lesson) => lesson.id === state.lessonId) || course.lessons[0];
  }

  function progressFor(lessonId) {
    if (!state.progress[lessonId]) {
      state.progress[lessonId] = { attempts: 0, correct: 0, completed: false, stars: 0, lastAnswer: '', updatedAt: '' };
    }
    return state.progress[lessonId];
  }

  function allLessonProgress() {
    return DATA.courses.flatMap((course) => course.lessons.map((lesson) => ({
      course,
      lesson,
      progress: state.progress[lesson.id] || null
    })));
  }

  function summary() {
    const all = allLessonProgress();
    const attempted = all.filter((item) => item.progress?.attempts > 0);
    const completed = all.filter((item) => item.progress?.completed);
    const correct = attempted.reduce((sum, item) => sum + (item.progress?.correct || 0), 0);
    const attempts = attempted.reduce((sum, item) => sum + (item.progress?.attempts || 0), 0);
    const stars = all.reduce((sum, item) => sum + (item.progress?.stars || 0), 0);
    return {
      total: all.length,
      attempted: attempted.length,
      completed: completed.length,
      attempts,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
      stars
    };
  }

  function ensureSelection() {
    const courseList = coursesForSubject();
    if (!courseList.some((course) => course.id === state.courseId)) {
      state.courseId = courseList[0]?.id || DATA.courses[0].id;
    }
    const course = activeCourse();
    if (!course.lessons.some((lesson) => lesson.id === state.lessonId)) {
      state.lessonId = course.lessons[0].id;
    }
  }

  function setRole(role) {
    state.role = role;
    if (role === 'signup') state.feedback = '이름을 입력하면 학생용 학습 기록으로 바로 저장됩니다.';
    saveAndRender();
  }

  function setSubject(subject) {
    state.subject = subject;
    const course = coursesForSubject()[0] || DATA.courses[0];
    state.courseId = course.id;
    state.lessonId = course.lessons[0].id;
    state.cardIndex = 0;
    state.selectedAnswer = '';
    state.feedback = '';
    saveAndRender();
  }

  function setCourse(courseId) {
    const course = DATA.courses.find((item) => item.id === courseId);
    if (!course) return;
    state.courseId = course.id;
    state.subject = course.subject;
    state.lessonId = course.lessons[0].id;
    state.cardIndex = 0;
    state.selectedAnswer = '';
    state.feedback = '';
    saveAndRender();
  }

  function setLesson(lessonId) {
    const lesson = activeCourse().lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    state.lessonId = lesson.id;
    state.cardIndex = 0;
    state.selectedAnswer = '';
    state.feedback = '';
    saveAndRender();
  }

  function moveCard(delta) {
    const lesson = activeLesson();
    state.cardIndex = Math.max(0, Math.min(lesson.cards.length - 1, state.cardIndex + delta));
    saveAndRender();
  }

  function answerQuiz(answer) {
    const lesson = activeLesson();
    const progress = progressFor(lesson.id);
    const correct = String(answer) === String(lesson.quiz.answer);
    progress.attempts += 1;
    if (correct) progress.correct += 1;
    progress.lastAnswer = String(answer);
    progress.updatedAt = new Date().toISOString();
    if (correct) {
      progress.completed = true;
      progress.stars = Math.max(progress.stars, 1);
    }
    state.selectedAnswer = String(answer);
    state.feedback = correct ? '정답입니다. 3D 학습 별을 획득했습니다.' : `다시 생각해 봅니다. ${lesson.quiz.explanation}`;
    saveAndRender();
  }

  function completeMission() {
    const lesson = activeLesson();
    const progress = progressFor(lesson.id);
    progress.completed = true;
    progress.stars = Math.max(progress.stars, 1);
    progress.updatedAt = new Date().toISOString();
    state.feedback = `${lesson.title} 미션을 완료했습니다.`;
    saveAndRender();
  }

  function speakLesson() {
    const lesson = activeLesson();
    const text = lesson.listenText || lesson.speakPrompt || lesson.title;
    if (!('speechSynthesis' in window)) {
      state.feedback = '이 브라우저에서는 음성 듣기를 사용할 수 없습니다.';
      saveAndRender();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lesson.subject === 'english' ? 'en-US' : 'ko-KR';
    utterance.rate = lesson.subject === 'english' ? .82 : .92;
    window.speechSynthesis.speak(utterance);
  }

  function submitSignup(form) {
    const name = String(new FormData(form).get('name') || '').trim() || '푸르넷 학습자';
    const role = String(new FormData(form).get('role') || 'student');
    state.learnerName = name;
    state.role = role;
    state.users.push({
      id: `user-${Date.now().toString(36)}`,
      name,
      role,
      createdAt: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    });
    state.feedback = `${name} ${roleLabels[role] || '학생용'} 프로필을 저장했습니다.`;
    saveAndRender();
  }

  function saveAndRender() {
    saveState();
    render();
  }

  function render() {
    ensureSelection();
    const root = document.getElementById('app');
    root.innerHTML = '';
    root.append(renderHeader(), renderLayout());
    const lesson = activeLesson();
    sceneApi.update({
      subject: state.subject === 'all' ? lesson.subject : state.subject,
      courseTitle: activeCourse().title,
      lessonTitle: lesson.title,
      percent: Math.round((summary().completed / Math.max(summary().total, 1)) * 100)
    });
  }

  function renderHeader() {
    return el('header', { class: 'topbar' }, [
      el('button', { class: 'brand', type: 'button', onclick: () => setSubject('math') }, [
        el('span', { class: 'brand-mark' }, ['P']),
        el('span', null, ['푸르넷 영어 수학 학원'])
      ]),
      el('nav', { class: 'top-actions', 'aria-label': '권한별 화면' },
        Object.entries(roleLabels).map(([role, label]) => el('button', {
          type: 'button',
          class: state.role === role ? 'active' : '',
          onclick: () => setRole(role)
        }, [label]))
      )
    ]);
  }

  function renderLayout() {
    return el('section', { class: 'learning-app-grid' }, [
      renderSidebar(),
      renderLessonWorkspace(),
      renderRolePanel()
    ]);
  }

  function renderSidebar() {
    const stats = summary();
    return el('aside', { class: 'course-sidebar' }, [
      el('div', { class: 'subject-tabs', role: 'group', 'aria-label': '과목 선택' },
        DATA.subjects.map((subject) => el('button', {
          type: 'button',
          class: state.subject === subject.id ? 'active' : '',
          style: `--accent:${subject.accent}`,
          onclick: () => setSubject(subject.id)
        }, [el('b', null, [subject.visual]), el('span', null, [subject.label])]))
      ),
      el('div', { class: 'mini-stats' }, [
        statBox('통합 모듈', `${DATA.stats.totalLessons}개`),
        statBox('완료', `${stats.completed}/${stats.total}`),
        statBox('정답률', `${stats.accuracy}%`),
        statBox('별', `${stats.stars}개`)
      ]),
      el('div', { class: 'course-list' }, coursesForSubject().map((course) => el('button', {
        type: 'button',
        class: state.courseId === course.id ? 'course-item active' : 'course-item',
        style: `--accent:${course.accent}`,
        onclick: () => setCourse(course.id)
      }, [
        el('span', null, [course.level]),
        el('strong', null, [course.title]),
        el('small', null, [`${course.lessons.length}개 학습 · ${course.subtitle}`])
      ])))
    ]);
  }

  function statBox(label, value) {
    return el('article', null, [el('span', null, [label]), el('strong', null, [value])]);
  }

  function renderLessonWorkspace() {
    const course = activeCourse();
    const lesson = activeLesson();
    const progress = progressFor(lesson.id);
    const card = lesson.cards[state.cardIndex] || lesson.cards[0];
    return el('main', { class: 'lesson-workspace', style: `--accent:${course.accent}` }, [
      el('section', { class: 'lesson-hero-card' }, [
        el('div', { class: 'lesson-copy' }, [
          el('span', { class: 'eyebrow' }, [`${course.title} · ${lesson.month}`]),
          el('h1', null, [lesson.title]),
          el('p', null, [lesson.story]),
          el('div', { class: 'lesson-actions' }, [
            el('button', { type: 'button', onclick: speakLesson }, [lesson.subject === 'english' ? '영어 듣기' : '설명 듣기']),
            el('button', { type: 'button', onclick: completeMission }, ['미션 완료'])
          ])
        ]),
        el('div', { class: 'lesson-visual' }, [
          el('span', null, [lesson.visual]),
          el('small', null, [progress.completed ? '완료' : '진행 중'])
        ])
      ]),
      state.feedback ? el('p', { class: 'feedback-line' }, [state.feedback]) : null,
      el('section', { class: 'lesson-grid' }, [
        el('article', { class: 'study-cardbook' }, [
          el('div', { class: 'panel-head' }, [
            el('div', null, [el('span', { class: 'eyebrow' }, ['카드북']), el('h2', null, [card.front])]),
            el('span', { class: 'card-count' }, [`${state.cardIndex + 1}/${lesson.cards.length}`])
          ]),
          el('div', { class: 'flip-card' }, [
            el('div', { class: 'card-visual' }, [card.visual]),
            el('strong', null, [card.back])
          ]),
          el('div', { class: 'card-nav' }, [
            el('button', { type: 'button', onclick: () => moveCard(-1), disabled: state.cardIndex <= 0 }, ['이전']),
            el('button', { type: 'button', onclick: () => moveCard(1), disabled: state.cardIndex >= lesson.cards.length - 1 }, ['다음'])
          ])
        ]),
        el('article', { class: 'quiz-panel' }, [
          el('div', { class: 'panel-head' }, [
            el('div', null, [el('span', { class: 'eyebrow' }, ['학습 게임']), el('h2', null, ['대표 문제'])]),
            el('span', { class: progress.completed ? 'status done' : 'status' }, [progress.completed ? '별 획득' : '도전'])
          ]),
          el('p', { class: 'quiz-prompt' }, [lesson.quiz.prompt]),
          el('div', { class: 'choice-grid' }, lesson.quiz.choices.map((choice) => {
            const selected = state.selectedAnswer === String(choice);
            const correct = String(choice) === String(lesson.quiz.answer);
            const className = selected ? (correct ? 'choice selected correct' : 'choice selected wrong') : 'choice';
            return el('button', { type: 'button', class: className, onclick: () => answerQuiz(choice) }, [String(choice)]);
          })),
          el('p', { class: 'explain' }, [lesson.quiz.explanation])
        ])
      ]),
      renderLessonMap(course)
    ]);
  }

  function renderLessonMap(course) {
    return el('section', { class: 'lesson-map-panel' }, [
      el('div', { class: 'panel-head' }, [
        el('div', null, [el('span', { class: 'eyebrow' }, ['학습 지도']), el('h2', null, [course.title])]),
        el('small', null, [`${course.lessons.length}개 미션`])
      ]),
      el('div', { class: 'lesson-map' }, course.lessons.map((lesson, index) => {
        const progress = state.progress[lesson.id];
        return el('button', {
          type: 'button',
          class: `${state.lessonId === lesson.id ? 'active ' : ''}${progress?.completed ? 'done' : ''}`,
          onclick: () => setLesson(lesson.id),
          title: lesson.title
        }, [String(index + 1)]);
      }))
    ]);
  }

  function renderRolePanel() {
    if (state.role === 'signup') return renderSignupPanel();
    if (state.role === 'teacher') return renderTeacherPanel();
    if (state.role === 'admin') return renderAdminPanel();
    return renderStudentPanel();
  }

  function renderSignupPanel() {
    const nameInput = el('input', { name: 'name', value: state.learnerName, placeholder: '학생 또는 선생님 이름', autocomplete: 'name' });
    const roleSelect = el('select', { name: 'role' }, [
      el('option', { value: 'student' }, ['학생용']),
      el('option', { value: 'teacher' }, ['교사용']),
      el('option', { value: 'admin' }, ['관리자'])
    ]);
    const form = el('form', {
      class: 'quick-form',
      onsubmit: (event) => {
        event.preventDefault();
        submitSignup(event.currentTarget);
      }
    }, [
      el('label', null, [el('span', null, ['이름']), nameInput]),
      el('label', null, [el('span', null, ['역할']), roleSelect]),
      el('button', { type: 'submit' }, ['프로필 저장'])
    ]);
    return panelShell('회원가입', '통합 학습 기록을 같은 브라우저에 저장합니다.', [form, renderUserList()]);
  }

  function renderStudentPanel() {
    const s = summary();
    return panelShell('학생용 현재 학습', `${state.learnerName} 학습자의 수학·영어 통합 진도를 보여줍니다.`, [
      el('div', { class: 'role-metrics' }, [
        statBox('완료 미션', `${s.completed}개`),
        statBox('누적 별', `${s.stars}개`),
        statBox('정답률', `${s.accuracy}%`)
      ]),
      renderRecentProgress()
    ]);
  }

  function renderTeacherPanel() {
    const s = summary();
    const weak = allLessonProgress().filter((item) => item.progress?.attempts && !item.progress.completed).slice(0, 4);
    return panelShell('교사용 모니터링', '등록 학생의 현재 학습 위치, 정답률, 보충 필요 모듈을 확인합니다.', [
      el('div', { class: 'role-metrics' }, [
        statBox('통합 학습자', `${Math.max(1, state.users.length)}명`),
        statBox('풀이 기록', `${s.attempts}건`),
        statBox('보충 필요', `${weak.length}개`)
      ]),
      weak.length
        ? el('div', { class: 'monitor-list' }, weak.map((item) => monitorItem(item.lesson.title, `${item.course.title} · 다시 풀기 추천`)))
        : monitorItem('보충 필요 없음', '현재 오답 미완료 모듈이 없습니다.')
    ]);
  }

  function renderAdminPanel() {
    return panelShell('관리자 콘텐츠 관리', '수학과 영어 학습 데이터를 한 사이트에서 운영하는 ROOT 모니터링 화면입니다.', [
      el('div', { class: 'role-metrics' }, [
        statBox('수학 코스', `${DATA.stats.mathCourses}개`),
        statBox('영어 코스', `${DATA.stats.englishCourses}개`),
        statBox('통합 모듈', `${DATA.stats.totalLessons}개`)
      ]),
      el('div', { class: 'admin-inventory' }, DATA.courses.slice(0, 10).map((course) =>
        monitorItem(course.title, `${course.lessons.length}개 모듈 · ${course.subtitle}`)
      ))
    ]);
  }

  function panelShell(title, copy, children) {
    return el('aside', { class: 'role-panel' }, [
      el('div', null, [el('span', { class: 'eyebrow' }, [roleLabels[state.role] || '학생용']), el('h2', null, [title]), el('p', null, [copy])]),
      ...children
    ]);
  }

  function renderRecentProgress() {
    const items = allLessonProgress()
      .filter((item) => item.progress?.updatedAt)
      .sort((a, b) => Date.parse(b.progress.updatedAt) - Date.parse(a.progress.updatedAt))
      .slice(0, 5);
    if (!items.length) return monitorItem('최근 학습 없음', '카드북을 보고 대표 문제를 풀면 여기에 기록됩니다.');
    return el('div', { class: 'monitor-list' }, items.map((item) =>
      monitorItem(item.lesson.title, `${item.course.title} · ${item.progress.completed ? '완료' : '진행 중'}`)
    ));
  }

  function renderUserList() {
    if (!state.users.length) return monitorItem('등록 대기', '아직 저장된 프로필이 없습니다.');
    return el('div', { class: 'monitor-list' }, state.users.slice(-5).reverse().map((user) =>
      monitorItem(user.name, `${roleLabels[user.role] || '학생용'} · ${user.createdAt}`)
    ));
  }

  function monitorItem(title, detail) {
    return el('article', { class: 'monitor-item' }, [el('strong', null, [title]), el('span', null, [detail])]);
  }

  function createAcademyScene() {
    const canvas = document.getElementById('academy-scene');
    if (!canvas || !window.THREE) return { update() {} };
    const scene = new window.THREE.Scene();
    scene.fog = new window.THREE.Fog(0xe9f7f3, 10, 30);
    const camera = new window.THREE.PerspectiveCamera(48, 1, .1, 80);
    camera.position.set(0, 3.4, 10.5);
    const renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xe9f7f3, 1);

    scene.add(new window.THREE.HemisphereLight(0xffffff, 0x86b8bd, 2.3));
    const key = new window.THREE.DirectionalLight(0xffffff, 2.7);
    key.position.set(3, 7, 4);
    scene.add(key);

    const floor = new window.THREE.Mesh(
      new window.THREE.PlaneGeometry(26, 18),
      new window.THREE.MeshStandardMaterial({ color: 0xd6f0e8, roughness: .82 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.12;
    scene.add(floor);

    const campus = new window.THREE.Group();
    scene.add(campus);
    const mathTower = makeTower(0x0b7f73, -2.7, 'math');
    const englishTower = makeTower(0x3157b8, 2.7, 'english');
    campus.add(mathTower, englishTower);

    const learner = new window.THREE.Mesh(
      new window.THREE.SphereGeometry(.34, 32, 32),
      new window.THREE.MeshStandardMaterial({ color: 0xefb82f, roughness: .35, metalness: .08 })
    );
    learner.position.set(0, -.42, 1.1);
    scene.add(learner);

    const orbit = new window.THREE.Mesh(
      new window.THREE.TorusGeometry(4.3, .035, 12, 128),
      new window.THREE.MeshStandardMaterial({ color: 0xefb82f, emissive: 0x3d2a00, roughness: .42 })
    );
    orbit.rotation.x = Math.PI / 2;
    orbit.position.y = -.92;
    scene.add(orbit);

    let target = { subject: 'math', percent: 0 };
    let mouseX = 0;
    let mouseY = 0;

    function makeTower(color, x, name) {
      const group = new window.THREE.Group();
      group.userData.subject = name;
      group.position.x = x;
      const body = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(1.65, 2.5, .34),
        new window.THREE.MeshStandardMaterial({ color, roughness: .44, metalness: .06 })
      );
      const roof = new window.THREE.Mesh(
        new window.THREE.ConeGeometry(1.25, .85, 4),
        new window.THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .56 })
      );
      roof.position.y = 1.75;
      roof.rotation.y = Math.PI / 4;
      const steps = new window.THREE.Mesh(
        new window.THREE.BoxGeometry(2.25, .22, 1.25),
        new window.THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7 })
      );
      steps.position.set(0, -1.35, .42);
      group.add(body, roof, steps);
      return group;
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate(time) {
      const t = time * .001;
      campus.rotation.y = mouseX * .08;
      mathTower.position.y = Math.sin(t * 1.25) * .07 + (target.subject === 'math' ? .12 : 0);
      englishTower.position.y = Math.sin(t * 1.25 + Math.PI) * .07 + (target.subject === 'english' ? .12 : 0);
      learner.position.x += ((target.subject === 'english' ? 1.15 : target.subject === 'math' ? -1.15 : 0) - learner.position.x) * .035;
      learner.position.y = -.42 + Math.sin(t * 2.4) * .06;
      learner.scale.setScalar(1 + Math.min(target.percent, 100) / 420);
      orbit.rotation.z = t * .22;
      camera.position.x += (mouseX * .55 - camera.position.x) * .025;
      camera.position.y += (3.35 + mouseY * .24 - camera.position.y) * .025;
      camera.lookAt(0, .35, 0);
      renderer.render(scene, camera);
      window.requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (event) => {
      mouseX = (event.clientX / Math.max(window.innerWidth, 1) - .5) * 2;
      mouseY = (event.clientY / Math.max(window.innerHeight, 1) - .5) * 2;
    });
    resize();
    animate(0);
    return {
      update(next) {
        target = { ...target, ...next };
      }
    };
  }

  render();
})();
