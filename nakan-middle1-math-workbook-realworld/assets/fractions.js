// 분수 분할 시각화 스크립트
(function(){
  const den = document.getElementById('den');
  const num = document.getElementById('num');
  const denVal = document.getElementById('den-val');
  const numVal = document.getElementById('num-val');
  const svg = document.getElementById('fraction-svg');
  const toggle = document.getElementById('toggle-orient');
  let orient = 'horizontal';

  function render(){
    const D = parseInt(den.value,10);
    const N = Math.min(parseInt(num.value,10), D);
    denVal.textContent = D;
    numVal.textContent = N;
    while(svg.firstChild) svg.removeChild(svg.firstChild);

    const W = 600, H = 140, pad = 20;
    if(orient==='horizontal'){
      const unitW = (W - pad*2) / D;
      for(let i=0;i<D;i++){
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', pad + i*unitW);
        rect.setAttribute('y', pad);
        rect.setAttribute('width', unitW-2);
        rect.setAttribute('height', H - pad*2);
        rect.setAttribute('fill', i < N ? '#4CC3D9' : '#fff');
        rect.setAttribute('stroke','#666');
        svg.appendChild(rect);
      }
    } else {
      const unitH = (H - pad*2) / D;
      for(let i=0;i<D;i++){
        const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
        rect.setAttribute('x', pad);
        rect.setAttribute('y', pad + i*unitH);
        rect.setAttribute('width', W - pad*2);
        rect.setAttribute('height', unitH-2);
        rect.setAttribute('fill', i < N ? '#4CC3D9' : '#fff');
        rect.setAttribute('stroke','#666');
        svg.appendChild(rect);
      }
    }

    // fraction label
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x', W-50);
    text.setAttribute('y', H-10);
    text.setAttribute('font-size', '16');
    text.setAttribute('fill','#333');
    text.textContent = N + ' / ' + D;
    svg.appendChild(text);
  }

  den.addEventListener('input', render);
  num.addEventListener('input', ()=>{
    // keep numerator <= denominator
    if(parseInt(num.value,10) > parseInt(den.value,10)) num.value = den.value;
    render();
  });
  toggle.addEventListener('click', ()=>{ orient = orient==='horizontal' ? 'vertical' : 'horizontal'; render(); });

  // initial
  render();
})();
