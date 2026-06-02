// Monster Track mixed-operations game
(function(){
  const startBtn = document.getElementById('start');
  const difficulty = document.getElementById('difficulty');
  const countIn = document.getElementById('count');
  const monstersWrap = document.getElementById('monsters');
  const player = document.getElementById('player');
  const questionEl = document.getElementById('question');
  const answerIn = document.getElementById('answer');
  const submit = document.getElementById('submit');
  const result = document.getElementById('result');

  let problems = [];
  let index = 0;

  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}

  function genProblem(level){
    // create a mixed operation expression as string and numeric answer
    const ops = ['+','-','*','/'];
    const makeNum = ()=> randInt(1, level=== 'easy' ? 9 : level==='normal' ? 12 : 20);
    const a = makeNum(); const b = makeNum(); const op = ops[randInt(0, level==='hard'?3:2)];
    let expr = `${a} ${op} ${b}`;
    let val = eval(expr);
    if(op === '/'){
      // ensure integral
      val = Math.floor(val);
      expr = `${a*b} / ${b}`; val = a;
    }
    return {expr, ans: val};
  }

  function startGame(){
    const level = difficulty.value; const cnt = Math.max(3, Math.min(20, Number(countIn.value)||6));
    problems = Array.from({length:cnt}, ()=> genProblem(level));
    index = 0; renderMonsters(cnt); showProblem(); result.textContent = '';
  }

  function renderMonsters(n){ monstersWrap.innerHTML=''; for(let i=0;i<n;i++){const m=document.createElement('div');m.className='monster';m.textContent='👾';monstersWrap.appendChild(m);} updatePlayer(); }

  function showProblem(){ const p = problems[index]; questionEl.textContent = `문제 ${index+1}: ${p.expr}`; answerIn.value=''; answerIn.focus(); }

  function submitAnswer(){ const p = problems[index]; const v = Number(answerIn.value); if(Number.isNaN(v)){ alert('숫자를 입력하세요'); return;} if(Math.abs(v - p.ans) < 1e-6){ index++; movePlayer(); if(index>=problems.length){ result.textContent='축하합니다! 모든 문제 완료'; questionEl.textContent='게임 종료'; } else showProblem(); } else { result.textContent='틀렸습니다. 다시 시도하세요.'; } }

  function movePlayer(){ const total = monstersWrap.children.length; const step = (monstersWrap.clientWidth - 40) / Math.max(1,total-1); player.style.left = (8 + step * Math.min(index, total-1)) + 'px'; }
  function updatePlayer(){ player.style.left='8px'; }

  startBtn.addEventListener('click', startGame);
  submit.addEventListener('click', submitAnswer);
  answerIn.addEventListener('keypress', (e)=>{ if(e.key==='Enter') submitAnswer(); });

  // initial
  renderMonsters(6);
})();
