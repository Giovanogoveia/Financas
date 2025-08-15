(() => {
  const KEY = 'investimentos_v3';
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const PCT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Logos conhecidos (edite à vontade)
  const logoMap = {
    "nubank": "https://logo.clearbit.com/nubank.com.br",
    "banco itaú": "https://logo.clearbit.com/itau.com.br",
    "itaú": "https://logo.clearbit.com/itau.com.br",
    "banco do brasil": "https://logo.clearbit.com/bb.com.br",
    "caixa": "https://logo.clearbit.com/caixa.gov.br",
    "bradesco": "https://logo.clearbit.com/bradesco.com.br",
    "santander": "https://logo.clearbit.com/santander.com.br",
    "inter": "https://logo.clearbit.com/bancointer.com.br",
    "neon": "https://logo.clearbit.com/neon.com.br",
    "sicredi": "https://logo.clearbit.com/sicredi.com.br",
    "sicoob": "https://logo.clearbit.com/sicoob.com.br"
  };

  const state = {
    data: load(),
    theme: (localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  };

  const palette = [
    ['#3b82f6','#22d3ee'], ['#22c55e','#84cc16'], ['#a78bfa','#60a5fa'],
    ['#f59e0b','#ef4444'], ['#06b6d4','#10b981'], ['#ec4899','#f43f5e'],
    ['#8b5cf6','#06b6d4'], ['#14b8a6','#3b82f6'], ['#f97316','#22d3ee']
  ];
  const colorMap = new Map();
  function gradFor(name){
    if(!colorMap.has(name)){
      const idx = Math.abs(hash(name)) % palette.length;
      const [a,b] = palette[idx];
      colorMap.set(name, `linear-gradient(135deg, ${a}, ${b})`);
    }
    return colorMap.get(name);
  }
  function hash(s){ let h=0; for(let c of s) h=(h<<5)-h+c.charCodeAt(0); return h; }

  function load(){
    const raw = localStorage.getItem(KEY);
    if (raw){
      try { return JSON.parse(raw); } catch {}
    }
    // inicial com logos e um histórico semeado
    return {
      "Banco Itaú":       { aplicado: 2000, atual: 2000, icon: logoMap["banco itaú"], hist: seedHist(2000) },
      "Banco do Brasil":  { aplicado: 1500, atual: 1500, icon: logoMap["banco do brasil"], hist: seedHist(1500) },
      "Caixa":            { aplicado: 1000, atual: 1000, icon: logoMap["caixa"], hist: seedHist(1000) },
      "Nubank":           { aplicado: 2500, atual: 2500, icon: logoMap["nubank"], hist: seedHist(2500) }
    };
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state.data)); }

  // cria um histórico "bonito" em volta do valor atual
  function seedHist(base){
    const out=[]; let v = base * (0.92 + Math.random()*0.16);
    for(let i=0;i<12;i++){
      v = v * (0.98 + Math.random()*0.04);  // pequenas variações
      out.push(Math.max(0, v));
    }
    return out;
  }

  function calc(b){
    const aplicado = Number(b.aplicado)||0;
    const atual = Number(b.atual)||0;
    const dif = atual - aplicado;
    const rend = aplicado>0 ? (dif/aplicado)*100 : 0;
    const prog = aplicado>0 ? (atual/aplicado)*100 : 0; // percentual para a barra
    return { aplicado, atual, dif, rend, prog };
  }

  function render(){
    document.documentElement.setAttribute('data-theme', state.theme);
    renderStats();
    renderCards();
  }

  function renderStats(){
    const entries = Object.values(state.data);
    const totAplicado = entries.reduce((s,b)=>s+Number(b.aplicado||0),0);
    const totAtual    = entries.reduce((s,b)=>s+Number(b.atual||0),0);
    const totDif = totAtual - totAplicado;
    const totRend = totAplicado>0 ? (totDif/totAplicado)*100 : 0;
    $('#stats').innerHTML = `
      <div class="stat"><div class="label">Total aplicado</div><div class="value">${BRL.format(totAplicado)}</div></div>
      <div class="stat"><div class="label">Total atual</div><div class="value">${BRL.format(totAtual)}</div></div>
      <div class="stat"><div class="label">Diferença</div>
        <div class="value" style="color:${totDif>=0?'var(--ok)':'var(--bad)'}">${BRL.format(totDif)}</div>
      </div>
      <div class="stat"><div class="label">% rendimento geral</div>
        <div class="value">${PCT.format(totRend)}%</div>
      </div>
    `;
  }

  function filteredAndSorted(){
    const q = $('#q').value.trim().toLowerCase();
    let arr = Object.entries(state.data).filter(([nome]) => nome.toLowerCase().includes(q));
    arr = arr.map(([nome, b]) => {
      const m = calc(b);
      return { nome, ...m, raw:b };
    });
    arr.sort((a,b)=>{
      switch($('#sort').value){
        case 'aplicado': return b.aplicado - a.aplicado;
        case 'diferenca': return b.dif - a.dif;
        case 'rendimento': return b.rend - a.rend;
        default: return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity:'base' });
      }
    });
    return arr;
  }

  function logoURL(value, nome){
    const v = (value || '').trim();
    if (/^https?:\/\//i.test(v)) return v;
    const key = nome.toLowerCase();
    if (logoMap[key]) return logoMap[key];
    for (const k of Object.keys(logoMap)){ if (key.includes(k)) return logoMap[k]; }
    return '';
  }

  function iconHTML(iconValue, nome){
    const url = logoURL(iconValue, nome);
    if (url){
      const esc = url.replace(/"/g, '&quot;');
      const letter = nome.charAt(0).toUpperCase().replace(/"/g,'&quot;');
      return `<img src="${esc}" alt="" referrerpolicy="no-referrer"
               onerror="this.outerHTML='<span class=&quot;letter&quot;>${letter}</span>'">`;
    }
    return `<span class="letter">${nome.charAt(0).toUpperCase()}</span>`;
  }

  // gera o caminho SVG do sparkline
  function sparkPath(values, w=140, h=36, pad=2){
    const arr = (values||[]).slice(-40); // limita
    if (arr.length === 0) return '';
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const span = (max - min) || 1;
    const step = (w - pad*2) / Math.max(1, (arr.length - 1));
    let d = '';
    arr.forEach((v,i)=>{
      const x = pad + i*step;
      const y = pad + (h - pad*2) * (1 - (v - min)/span);
      d += (i? 'L':'M') + x + ',' + y + ' ';
    });
    return d.trim();
  }

  function cardTemplate(it){
    const pos = it.dif >= 0;
    const ringColor = gradFor(it.nome).match(/#?[a-f0-9]{3,6}/ig)?.[0] || '#22d3ee';
    const iconVal = (state.data[it.nome] && state.data[it.nome].icon) || '';
    const hist = (state.data[it.nome] && state.data[it.nome].hist) || [];
    const d = sparkPath(hist);
    const progCap = Math.max(0, Math.min(100, it.prog));

    return `
      <article class="card" data-bank="${it.nome}" tabindex="0" aria-label="Editar ${it.nome}">
        <div class="ring-wrap">
          <div class="ring" style="--p:${Math.max(0, Math.min(100, it.rend))}; --ring-color:${ringColor}" data-label="${PCT.format(it.rend)}%"></div>
        </div>

        <div class="card-head">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="avatar" style="--grad:${gradFor(it.nome)}; background: var(--grad)">${iconHTML(iconVal, it.nome)}</div>
            <div class="name">${it.nome}</div>
          </div>
          <button class="menu" title="Editar" aria-label="Editar ${it.nome}">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div class="kvs">
          <div class="label">Aplicado</div><div>${BRL.format(it.aplicado)}</div>
          <div class="label">Atual</div><div>${BRL.format(it.atual)}</div>
          <div class="label">Diferença</div>
          <div><span class="pill ${pos?'pos':'neg'}">${BRL.format(it.dif)}</span></div>
          <div class="label">% Rendimento</div><div><strong>${PCT.format(it.rend)}%</strong></div>
        </div>

        <div class="progress-row">
          <span class="badge ${pos?'pos':'neg'}">Progresso: ${PCT.format(it.prog)}%</span>
          <div class="meter"><div class="fill" style="--w:${progCap}%"></div></div>
        </div>

        <div class="spark-wrap">
          <svg class="spark" viewBox="0 0 140 36" preserveAspectRatio="none" aria-hidden="true">
            <path class="spark-grid" d="M0,35 H140" />
            <path class="spark-line" stroke="${pos?'var(--ok)':'var(--bad)'}" d="${d}" />
          </svg>
        </div>
      </article>
    `;
  }

  function renderCards(){
    const arr = filteredAndSorted();
    $('#cards').innerHTML = arr.map(cardTemplate).join('') || `<div class="hint">Nenhum banco encontrado.</div>`;
    $$('#cards .card').forEach(el=>{
      el.addEventListener('click', () => openForm(el.dataset.bank));
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openForm(el.dataset.bank); }});
    });
  }

  // ===== Modal =====
  const modal = $('#modal');
  const inputNome = $('#nome');
  const inputApl = $('#aplicado');
  const inputAtu = $('#atual');
  const inputIcon = $('#icone');
  const btnSalvar = $('#salvar');
  const btnCancelar = $('#cancelar');
  const btnExcluir = $('#excluir');
  const subForm = $('#sub-form');

  let editingName = null;

  function openForm(nome){
    editingName = (nome ?? null);
    $('#title-form').textContent = editingName ? 'Editar banco' : 'Adicionar banco';

    if (editingName){
      const b = state.data[editingName];
      inputNome.value = editingName;
      inputApl.value = Number(b.aplicado||0);
      inputAtu.value = Number(b.atual||0);
      inputIcon.value = b.icon || '';
      btnExcluir.style.display = 'inline-flex';
      subForm.textContent = 'Atualize os valores e clique em Salvar.';
    } else {
      inputNome.value = '';
      inputApl.value = '';
      inputAtu.value = '';
      inputIcon.value = '';
      btnExcluir.style.display = 'inline-flex';
      subForm.textContent = 'Informe nome, valores e (opcional) URL do logo.';
    }

    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    inputNome.focus();
  }

  function closeForm(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); editingName=null; }
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeForm(); });
  btnCancelar.addEventListener('click', closeForm);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && modal.classList.contains('open')) closeForm(); });

  btnSalvar.addEventListener('click', saveForm);
  inputAtu.addEventListener('keydown', (e)=>{ if(e.key==='Enter') saveForm(); });

  function ensureHist(nome){
    const b = state.data[nome];
    if (!b.hist || b.hist.length < 2){
      b.hist = seedHist(b.atual || b.aplicado || 0);
    }
  }

  function saveForm(){
    const nome = inputNome.value.trim();
    const aplicado = parseFloat(inputApl.value)||0;
    const atual = parseFloat(inputAtu.value)||0;
    const icon = inputIcon.value.trim();

    if(!nome){ alert('Informe o nome do banco.'); inputNome.focus(); return; }

    const payload = { aplicado, atual };
    if (icon) payload.icon = icon;

    if (editingName && nome !== editingName){
      if (state.data[nome]){ alert('Já existe um banco com esse nome. Escolha outro.'); return; }
      delete state.data[editingName];
      state.data[nome] = payload;
    } else {
      state.data[nome] = Object.assign({}, state.data[nome], payload);
    }

    // histórico: adiciona o valor atual
    ensureHist(nome);
    const hist = state.data[nome].hist || [];
    hist.push(atual);
    if (hist.length > 20) hist.shift();
    state.data[nome].hist = hist;

    save(); render(); closeForm();
  }

  btnExcluir.addEventListener('click', ()=>{
    const nome = inputNome.value.trim();
    if (!nome || !state.data[nome]){ alert('Banco não encontrado.'); return; }
    if (confirm(`Excluir "${nome}"?`)){
      delete state.data[nome];
      save(); render(); closeForm();
    }
  });

  // Toolbar
  $('#q').addEventListener('input', renderCards);
  $('#sort').addEventListener('change', renderCards);
  $('#add').addEventListener('click', ()=>openForm(null));
  $('#theme').addEventListener('click', ()=>{
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    render();
  });

  // Cria histórico inicial quando faltar
  for (const nome of Object.keys(state.data)) ensureHist(nome);

  render();
})();
