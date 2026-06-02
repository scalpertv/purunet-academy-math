// 쌓기나무 시뮬레이터: 목표 개수 만들기 간단한 UI
(function(){
  const targetInput = document.getElementById('target-count');
  const startBtn = document.getElementById('start-build');
  const area = document.getElementById('blocks-area');

  function renderBlocks(n){
    area.innerHTML = '';
    for(let i=0;i<n;i++){
      const b = document.createElement('div');
      b.className = 'block';
      b.textContent = i+1;
      b.draggable = true;
      b.addEventListener('dragstart',(e)=>{ e.dataTransfer.setData('text/plain', i); });
      area.appendChild(b);
    }
  }

  startBtn.addEventListener('click', ()=>{
    const target = Math.max(1, Math.min(20, Number(targetInput.value)||6));
    // create some random blocks to let student count/build
    renderBlocks(target);
  });

  // initial
  renderBlocks(6);
})();
