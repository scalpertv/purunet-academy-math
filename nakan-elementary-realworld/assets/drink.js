// 음료수 만들기: 간단한 비례 평가 로직
(function(){
  const water = document.getElementById('water');
  const syrup = document.getElementById('syrup');
  const lemon = document.getElementById('lemon');
  const waterVal = document.getElementById('water-val');
  const syrupVal = document.getElementById('syrup-val');
  const lemonVal = document.getElementById('lemon-val');
  const cup = document.getElementById('drink-cup');
  const score = document.getElementById('drink-score');

  const target = {water:60, syrup:30, lemon:10}; // 예시 레시피

  function update(){
    const w = Number(water.value), s = Number(syrup.value), l = Number(lemon.value);
    waterVal.textContent = w; syrupVal.textContent = s; lemonVal.textContent = l;
    // 시각화: 컵 내부 높이 비율
    const total = w+s+l || 1;
    const wH = Math.round((w/total)*100);
    const sH = Math.round((s/total)*100);
    const lH = Math.round((l/total)*100);
    cup.innerHTML = `<div style="height:${lH}% ; background:#ffe4b5"></div><div style="height:${sH}%; background:#ff8fa3"></div><div style="height:${wH}%; background:#aee1f8"></div>`;
    // 평가: 목표 비율과의 차
    const scoreVal = Math.max(0, 100 - Math.round(Math.abs((w/total)-(target.water/100))*200 + Math.abs((s/total)-(target.syrup/100))*200 + Math.abs((l/total)-(target.lemon/100))*200));
    score.textContent = '레시피 적합도: ' + scoreVal + '%';
  }

  [water, syrup, lemon].forEach(el=>el.addEventListener('input', update));
  update();
})();
