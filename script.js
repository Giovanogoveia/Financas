(() => {
  // ====== Supabase ======
  const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  let USER_ID = null;

  // ====== Locale/Número ======
  const parseLocaleNumber = (v) => {
    if (typeof v === 'number') return v;
    if (v == null) return 0;
    const s = String(v).trim().replace(/\./g,'').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // ====== Formatação/DOM ======
  const KEY = 'investimentos_v3';
  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const PCT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  const state = {
    data: loadLocal(),
    theme: (localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'))
  };

  // Gradientes
  const palette = [
    ['#3b82f6','#22d3ee'], ['#22c55e','#84cc16'], ['#a78bfa','#60a5fa'],
    ['#f59e0b','#ef4444'], ['#06b6d4','#10b981'], ['#ec4899','#f43f5e'],
    ['#8b5cf6','#06b6d4'], ['#14b8a6','#3b82f6'], ['#f97316','#22d3ee']
  ];
  const colorMap = new Map();
  const hash = (s)=>{ let h=0; for(let c of s) h=(h<<5)-h+c.charCodeAt(0); return h; };
  const gradFor = (name)=>{
    if(!colorMap.has(name)){
      const idx = Math.abs(hash(name)) % palette.length;
      const [a,b] = palette[idx];
      colorMap.set(name, `linear-gradient(135deg, ${a}, ${b})`);
    }
    return colorMap.get(name);
  };

  // ====== Storage local ======
  function loadLocal(){
    try{
      const raw = localStorage.getItem(KEY);
      if (raw){
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') return obj;
      }
    }catch(e){}
    return {
      "Banco Itaú":       { aplicado: 2000, atual: 2000 },
      "Banco do Brasil":  { aplicado: 1500, atual: 1500 },
      "Caixa":            { aplicado: 1000, atual: 1000 },
      "Nubank":           { aplicado: 2500, atual: 2500 }
    };
  }
  function saveLocal(){ localStorage.setItem(KEY, JSON.stringify(state.data)); }

  // ====== Cálculos ======
  function calc(b){
    const aplicado = Number(b.aplicado)||0;
    const atual = Number(b.atual)||0;
    const dif = atual - aplicado;
    const rend = aplicado>0 ? (dif/aplicado)*100 : 0;
    return { aplicado, atual, dif, rend };
  }

  // ====== Render ======
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
    const totRend = totAplicado>0 ? (difPerc(totDif, totAplicado)) : 0;
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
  const difPerc = (dif, base) => (base>0 ? (dif/base)*100 : 0);

  function filteredAndSorted(){
    const q = $('#q').value.trim().toLowerCase();
    let arr = Object.entries(state.data).filter(([nome]) => nome.toLowerCase().includes(q));
    arr = arr.map(([nome, b]) => {
      const { aplicado, atual, dif, rend } = calc(b);
      return { nome, aplicado, atual, dif, rend, raw:b };
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
  function cardTemplate(it){
    const pos = it.dif >= 0;
    const ringColor = gradFor(it.nome).match(/#?[a-f0-9]{3,6}/ig)?.[0] || '#22d3ee';
    return `
      <article class="card" data-bank="${it.nome}" tabindex="0" aria-label="Editar ${it.nome}">
        <div class="ring-wrap">
          <div class="ring" style="--p:${Math.max(0, Math.min(100, it.rend))}; --ring-color:${ringColor}" data-label="${PCT.format(it.rend)}%"></div>
        </div>
        <div class="card-head">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="avatar" style="--grad:${gradFor(it.nome)}; background: var(--grad)">${it.nome.charAt(0).toUpperCase()}</div>
            <div class="name">${it.nome}</div>
          </div>
          <button class="menu" title="Editar">
            <svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="kvs">
          <div class="label">Aplicado</div><div>${BRL.format(it.aplicado)}</div>
          <div class="label">Atual</div><div>${BRL.format(it.atual)}</div>
          <div class="label">Diferença</div>
          <div><span class="pill ${pos?'pos':'neg'}">${BRL.format(it.dif)}</span></div>
          <div class="label">% Rendimento</div><div><strong>${PCT.format(it.rend)}%</strong></div>
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

  // ====== Modal ======
  const modal = $('#modal');
  const inputNome = $('#nome');
  const inputApl = $('#aplicado');
  const inputAtu = $('#atual');
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
      btnExcluir.style.display = 'inline-flex';
      subForm.textContent = 'Atualize os valores e clique em Salvar.';
    } else {
      inputNome.value = '';
      inputApl.value = '';
      inputAtu.value = '';
      btnExcluir.style.display = 'none';
      subForm.textContent = 'Informe um nome e os valores inicial/atual para criar o banco.';
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

  async function saveForm(){
    const nome = inputNome.value.trim();
    const aplicado = parseLocaleNumber(inputApl.value);
    const atual = parseLocaleNumber(inputAtu.value);
    if(!nome){ alert('Informe o nome do banco.'); inputNome.focus(); return; }

    if (!editingName && state.data[nome]){
      alert('Já existe um banco com esse nome. Edite o existente ou escolha outro.');
      return;
    }
    if (editingName && nome !== editingName && state.data[nome]){
      alert('Já existe um banco com esse nome. Escolha outro.');
      return;
    }

    // Local
    if (editingName && nome !== editingName){
      delete state.data[editingName];
    }
    state.data[nome] = { aplicado, atual };
    saveLocal(); render(); closeForm();

    // Remoto
    try{
      const rows = [{ user_id: USER_ID, name: nome, aplicado, atual }];
      const { error } = await supa.from('investments').upsert(rows, { onConflict: 'user_id,name' });
      if (error) throw error;
    }catch(e){
      console.error(e);
      alert('Erro ao salvar no Supabase: ' + e.message);
    }
  }

  btnExcluir.addEventListener('click', async ()=>{
    const nome = inputNome.value.trim();
    if (!nome || !state.data[nome]){ alert('Banco não encontrado.'); return; }
    if (!confirm(`Excluir "${nome}"?`)) return;

    // Local
    delete state.data[nome];
    saveLocal(); render(); closeForm();

    // Remoto
    try{
      const { error } = await supa.from('investments')
        .delete()
        .eq('user_id', USER_ID)
        .eq('name', nome);
      if (error) throw error;
    }catch(e){
      console.error(e);
      alert('Erro ao excluir no Supabase: ' + e.message);
    }
  });

  // ====== Toolbar ======
  $('#q').addEventListener('input', renderCards);
  $('#sort').addEventListener('change', renderCards);
  $('#add').addEventListener('click', ()=>openForm(null));
  $('#theme').addEventListener('click', ()=>{
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    render();
  });

  // ====== Sync inicial ======
  async function init(){
    // sessão atual
    const { data: s1 } = await supa.auth.getSession();
    USER_ID = s1?.session?.user?.id || null;

    // login anônimo se necessário
    if (!USER_ID){
      const { data, error } = await supa.auth.signInAnonymously();
      if (error) {
        alert('Falha ao autenticar (anônimo). Verifique a chave ANON_KEY.');
        console.error(error);
      } else {
        USER_ID = data.user.id;
      }
    }

    // carregar/sincronizar
    try{
      const { data, error } = await supa.from('investments')
        .select('name, aplicado, atual')
        .eq('user_id', USER_ID)
        .order('name', { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0){
        // primeira vez: sobe o local
        const rows = Object.entries(state.data).map(([name, b]) => ({
          user_id: USER_ID,
          name,
          aplicado: Number(b.aplicado)||0,
          atual: Number(b.atual)||0
        }));
        if (rows.length){
          const { error: e2 } = await supa.from('investments')
            .upsert(rows, { onConflict: 'user_id,name' });
          if (e2) throw e2;
        }
      } else {
        // usa supabase como fonte de verdade
        state.data = Object.fromEntries(
          data.map(r => [r.name, { aplicado: Number(r.aplicado), atual: Number(r.atual) }])
        );
        saveLocal();
      }
    }catch(e){
      console.error(e);
      alert('Erro ao sincronizar com o Supabase: ' + e.message);
    }

    render();
  }

  // start
  init();
})();
