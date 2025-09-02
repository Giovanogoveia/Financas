    const supabaseUrl = 'https://dylziaqkyavkfwjepqkp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5bHppYXFreWF2a2Z3amVwcWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc1OTgsImV4cCI6MjA2ODAzMzU5OH0.gy5jXxKOTgeCf0Rwq7ktLTz1pyoZ8dJjZOK9UB9rHCM';
    const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const PCT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

    let bancoEditando = null;

    function renderCard({ id, nome, valor_aplicado, valor_atual, icone_url }) {
      const dif = valor_atual - valor_aplicado;
      const rend = valor_aplicado > 0 ? (dif / valor_aplicado) * 100 : 0;
      const pos = dif >= 0;

      return `
        <div class="card">
          <button class="delete-btn" onclick="excluirBanco(${id})">×</button>
          <div onclick="abrirModal(${id}, '${nome}', ${valor_aplicado}, ${valor_atual}, '${icone_url || ''}')">
            <div class="header">
              <div class="avatar">
                ${icone_url ? `<img src="${icone_url}" alt="${nome}">` : nome.charAt(0).toUpperCase()}
              </div>
              <div class="name">${nome}</div>
            </div>
            <div class="kvs">
              <div class="label">Aplicado</div><div>${BRL.format(valor_aplicado)}</div>
              <div class="label">Atual</div><div>${BRL.format(valor_atual)}</div>
              <div class="label">Diferença</div><div><span class="pill ${pos ? 'pos' : 'neg'}">${BRL.format(dif)}</span></div>
              <div class="label">% Rendimento</div><div><strong>${PCT.format(rend)}%</strong></div>
            </div>
          </div>
        </div>
      `;
    }

    async function carregarTodosOsCards() {
      const res = await fetch(`${supabaseUrl}/rest/v1/bancos?select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: "application/json"
        }
      });

      const data = await res.json();
      const container = document.getElementById('card-container');

      if (!data || !data.length) {
        container.innerHTML = '<div class="card">Nenhum banco encontrado.</div>';
        return;
      }

      container.innerHTML = data.map(renderCard).join('');

      let totalAplicado = 0;
      let totalAtual = 0;

      data.forEach(b => {
        totalAplicado += b.valor_aplicado;
        totalAtual += b.valor_atual;
      });

      const lucro = totalAtual - totalAplicado;
      const rendimento = totalAplicado > 0 ? (lucro / totalAplicado) * 100 : 0;

      document.getElementById('total-aplicado').innerText = BRL.format(totalAplicado);
      document.getElementById('total-atual').innerText = BRL.format(totalAtual);
      document.getElementById('lucro').innerText = BRL.format(lucro);
      document.getElementById('rendimento').innerText = PCT.format(rendimento) + '%';
    }

    function abrirModal(id = null, nome = '', aplicado = '', atual = '', icon = '') {
      bancoEditando = id;
      document.getElementById('modal-title').innerText = id ? 'Editar Banco' : 'Novo Banco';
      document.getElementById('input-nome').value = nome;
      document.getElementById('input-nome').disabled = !!id;
      document.getElementById('input-aplicado').value = aplicado;
      document.getElementById('input-atual').value = atual;
      document.getElementById('input-icon').value = icon;
      document.getElementById('modal').classList.add('open');
    }

    async function salvarAlteracoes() {
      const nome = document.getElementById('input-nome').value.trim();
      const aplicado = parseFloat(document.getElementById('input-aplicado').value);
      const atual = parseFloat(document.getElementById('input-atual').value);
      const icone = document.getElementById('input-icon').value.trim();

      const body = { nome, valor_aplicado: aplicado, valor_atual: atual, icone_url: icone };

      const url = bancoEditando
        ? `${supabaseUrl}/rest/v1/bancos?id=eq.${bancoEditando}`
        : `${supabaseUrl}/rest/v1/bancos`;

      const method = bancoEditando ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        document.getElementById('modal').classList.remove('open');
        carregarTodosOsCards();
      } else {
        alert('Erro ao salvar');
      }
    }

    async function excluirBanco(id) {
      if (!confirm('Tem certeza que deseja excluir este banco?')) return;

      const response = await fetch(`${supabaseUrl}/rest/v1/bancos?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        carregarTodosOsCards();
      } else {
        alert('Erro ao excluir');
      }
    }

    carregarTodosOsCards();
 
