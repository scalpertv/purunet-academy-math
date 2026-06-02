// 간단한 콘텐츠 매핑 UI: problems.json을 읽어 모듈 링크를 표시
(async function(){
  try{
    const res = await fetch('../content/problems.json');
    const data = await res.json();
    const container = document.createElement('div'); container.className='panel';
    const h = document.createElement('h3'); h.textContent='문제 매핑 목록'; container.appendChild(h);
    const ul = document.createElement('ul');
    data.forEach(p=>{ const li = document.createElement('li'); const a = document.createElement('a'); a.href = p.modulePath; a.textContent = `${p.id}: ${p.title}`; a.target='_blank'; li.appendChild(a); ul.appendChild(li); });
    container.appendChild(ul); document.body.appendChild(container);
  }catch(e){ console.error('콘텐츠 로드 실패', e); }
})();
