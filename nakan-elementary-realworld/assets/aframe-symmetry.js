// A-Frame symmetry interactions (간단한 평면 대칭 퀴즈 구현)
(function(){
  const plane = document.getElementById('plane');
  const shuffleBtn = document.getElementById('shuffle');
  const checkBtn = document.getElementById('check');
  const qInfo = document.getElementById('q-info');
  let pairs = [];

  function makeProblem(){
    // generate simple points on left half and mirrored positions to find
    pairs = [];
    for(let i=0;i<4;i++){
      const x = -1 + Math.random()*0.4; const y = -0.6 + Math.random()*1.2;
      const mirrorX = -x;
      pairs.push({x,y,mirrorX});
    }
    qInfo.textContent = '왼쪽 점들을 보고 오른쪽에 대응되는 점을 클릭하세요.';
    // use DOM for simplicity: append HTML overlay markers
    renderMarkers();
  }

  function renderMarkers(){
    // remove existing
    const existing = document.querySelectorAll('.sym-marker');
    existing.forEach(e=>e.remove());
    pairs.forEach((p,idx)=>{
      const el = document.createElement('div');
      el.className='sym-marker'; el.textContent = idx+1;
      el.style.position='absolute'; el.style.left=(50 + (p.x*80))+'%'; el.style.top=(40 - (p.y*20))+'%'; el.style.background='#ffea'; el.style.padding='6px';
      document.body.appendChild(el);
    });
  }

  shuffleBtn.addEventListener('click', makeProblem);
  checkBtn.addEventListener('click', ()=>{ alert('정답 확인: 실제 대칭 관계를 설명하는 교사용 노트를 참고하세요.'); });

  makeProblem();
})();
