// 실감형 데모 상호작용 스크립트
(function(){
  const selectInfo = (el)=>{
    document.getElementById('obj-title').textContent = '선택된 오브젝트: ' + (el.id||el.tagName);
    document.getElementById('obj-desc').textContent = '위치: ' + (el.getAttribute('position')||'') + ' | 색: ' + (el.getAttribute('color')||'');
    window.__selected = el;
  };

  const els = document.querySelectorAll('.interact');
  els.forEach(e=>{
    e.addEventListener('click', ev=>{
      selectInfo(e);
      const curScale = e.getAttribute('scale') || '1 1 1';
      const s = curScale.split(' ').map(Number);
      const next = (s[0]||1) * 1.2;
      e.setAttribute('scale', `${next} ${next} ${next}`);
      e.setAttribute('color', randomColor());
    });
  });

  document.getElementById('scale-up').addEventListener('click', ()=>{
    const e = window.__selected; if(!e) return;
    const s = (e.getAttribute('scale')||'1 1 1').split(' ').map(Number);
    const next = (s[0]||1) * 1.2;
    e.setAttribute('scale', `${next} ${next} ${next}`);
  });
  document.getElementById('scale-down').addEventListener('click', ()=>{
    const e = window.__selected; if(!e) return;
    const s = (e.getAttribute('scale')||'1 1 1').split(' ').map(Number);
    const next = (s[0]||1) / 1.2;
    e.setAttribute('scale', `${next} ${next} ${next}`);
  });
  document.getElementById('reset').addEventListener('click', ()=>{
    const e = window.__selected; if(!e) return;
    e.setAttribute('scale','1 1 1');
    // restore original color mapping simple
    if(e.id==='cube') e.setAttribute('color','#4CC3D9');
    if(e.id==='sphere') e.setAttribute('color','#EF2D5E');
    if(e.id==='cyl') e.setAttribute('color','#FFC65D');
  });

  function randomColor(){
    return '#'+Math.floor(Math.random()*16777215).toString(16);
  }
})();
