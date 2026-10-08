// Adds "결과 복사" / "텍스트로 저장" buttons to a test page's result screen.
// Relies on the globals each test page defines: S, SECS, secQs, stat, fmt, CIRC.
(function () {
  const app = document.getElementById('app');
  if (!app || typeof S === 'undefined') return;

  const pad = n => String(n).padStart(2, '0');
  const stamp = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  function buildText() {
    const st = SECS.map(s => ({ s, ...stat(s.id) }));
    const total = st.reduce((a, x) => a + x.n, 0);
    const ok = st.reduce((a, x) => a + x.ok, 0);
    const bad = st.reduce((a, x) => a + x.bad, 0);
    const skip = st.reduce((a, x) => a + x.skip, 0);
    const lines = [
      `${document.title} 결과 (${stamp(new Date())})`,
      `총점 ${ok} / ${total} (정답률 ${Math.round(ok / total * 100)}%) · 오답 ${bad} · 미응답 ${skip}`,
      '',
      '[영역별]',
    ];
    st.forEach(x => lines.push(
      `${x.s.name}: ${x.ok}/${x.n} · 오답 ${x.bad} · 미응답 ${x.skip} · 시간 ${fmt(S.used[x.s.id] ?? 0)} / ${fmt(x.s.time)}`
    ));
    lines.push('', '[문항별] O 정답 · X 오답 · - 미응답');
    SECS.forEach(s => {
      const marks = [], misses = [];
      secQs(s.id).forEach((q, i) => {
        const a = S.ans[q.id];
        if (a === undefined) { marks.push('-'); misses.push(`${i + 1}번(미응답, 정답 ${CIRC[q.ans]})`); }
        else if (a === q.ans) marks.push('O');
        else { marks.push('X'); misses.push(`${i + 1}번(내 답 ${CIRC[a]}, 정답 ${CIRC[q.ans]})`); }
      });
      lines.push(`${s.name}: ${marks.join(' ')}`);
      if (misses.length) lines.push(`  틀리거나 비운 문항: ${misses.join(', ')}`);
    });
    return lines.join('\n');
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let done = false;
    try { done = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return done;
  }

  function download(text) {
    const d = new Date();
    // ASCII-only name: some browsers drop non-ASCII download names and fall back to "download".
    // Each test page's storage KEY is unique and ASCII (e.g. dcat-half-v5, dcat-lang-A).
    const id = typeof KEY === 'string' ? KEY : 'dcat';
    const name = `${id}_result_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.txt`;
    const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function inject() {
    if (S.phase !== 'result' || document.getElementById('exp-copy')) return;
    const again = document.getElementById('again');
    if (!again) return;
    again.insertAdjacentHTML('afterend',
      '<button class="btn primary" id="exp-copy">결과 복사</button><button class="btn" id="exp-save">텍스트로 저장</button>');
    const cb = document.getElementById('exp-copy');
    cb.onclick = async () => {
      const ok = await copy(buildText());
      cb.textContent = ok ? '복사됨 ✓' : '복사 실패 · 저장을 이용하세요';
      setTimeout(() => { cb.textContent = '결과 복사'; }, 2000);
    };
    document.getElementById('exp-save').onclick = () => download(buildText());
  }

  new MutationObserver(inject).observe(app, { childList: true });
  inject();
})();
