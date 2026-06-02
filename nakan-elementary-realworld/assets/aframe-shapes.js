// A-Frame shapes interactions: 클릭으로 정보 표시, 자동 회전, 전개도(간단 설명)
(function(){
  const rotateBtn = document.getElementById('rotate');
  const explodeBtn = document.getElementById('explode');
  const select = document.getElementById('shape-select');
  const info = document.getElementById('info');
  let rotating = false;

  function setInfo(text){ info.textContent = text; }

  document.querySelectorAll('.shape').forEach(el=>{
    el.addEventListener('click', ()=>{
      setInfo(el.id + ' 선택됨 — 위치: ' + (el.getAttribute('position')||''));
      // highlight
      el.setAttribute('scale','1.2 1.2 1.2');
      setTimeout(()=>el.setAttribute('scale','1 1 1'),600);
    });
  });

  rotateBtn.addEventListener('click', ()=>{
    rotating = !rotating;
    document.querySelectorAll('.shape').forEach(el=>{
      if(rotating) el.setAttribute('rotation','0 45 0'); else el.setAttribute('rotation','0 0 0');
    });
  });

  explodeBtn.addEventListener('click', ()=>{
    alert('전개도: 정육면체는 6개의 정사각형, 원기둥은 원 + 직사각형 전개, 구는 전개도가 없음(특수한 사각망). 교사용 노트를 참조하세요.');
  });

  select.addEventListener('change', ()=>{
    const val = select.value;
    document.querySelectorAll('.shape').forEach(el=>el.setAttribute('visible', el.id===val));
  });
})();
