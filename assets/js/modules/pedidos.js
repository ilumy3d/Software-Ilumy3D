// ==========================================
// MÓDULO DE GESTÃO DE PEDIDOS & CATÁLOGO (ILUMY3D)
// ==========================================

const catalogoProdutos = {
    'PRD-001': { sku: 'PRD-001', nome: 'Suporte Headset PS5', insumo: 'PLA Preto (120g)', valorBase: 45.00, foto: '🎧' },
    'PRD-002': { sku: 'PRD-002', nome: 'Vasinho Decorativo LowPoly', insumo: 'PETG Vermelho (85g)', valorBase: 68.00, foto: '🪴' },
    'PRD-003': { sku: 'PRD-003', nome: 'Base Action Figure Diorama', insumo: 'PLA Branco (210g)', valorBase: 120.00, foto: '🏰' },
    'PRD-004': { sku: 'PRD-004', nome: 'Engrenagem Personalizada', insumo: 'ABS Cinza (50g)', valorBase: 35.00, foto: '⚙️' }
};

let pedidos = [];
let pedidoEmEdicaoId = null;

// Função global para troca de abas no Menu Lateral
window.trocarAba = function(nomeAba) {
    const abas = ['pedidos', 'catalogo', 'estoque', 'financas'];
    
    abas.forEach(aba => {
        const contentEl = document.getElementById('aba-' + aba);
        const navEl = document.getElementById('nav-' + aba);

        if (contentEl) contentEl.classList.add('hidden');
        if (navEl) {
            navEl.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/20');
            navEl.classList.add('text-slate-400', 'hover:text-slate-100', 'hover:bg-slate-800/60');
        }
    });

    const activeContent = document.getElementById('aba-' + nomeAba);
    const activeNav = document.getElementById('nav-' + nomeAba);

    if (activeContent) activeContent.classList.remove('hidden');
    if (activeNav) {
        activeNav.classList.remove('text-slate-400', 'hover:text-slate-100', 'hover:bg-slate-800/60');
        activeNav.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-600/20');
    }

    if (nomeAba === 'catalogo') renderizarTabelaCatalogo();
};

async function carregarPedidos() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                pedidos = data;
                renderizarKanban();
                return;
            }
        } catch(e) {}
    }
    
    const salvos = localStorage.getItem('3dcontrol_pedidos');
    if (salvos) {
        pedidos = JSON.parse(salvos);
    } else {
        pedidos = [
            { id: 1, origem: 'Mercado Livre', codigo: '#ML-10492', sku: 'PRD-002', produto: 'Vasinho Decorativo LowPoly', cliente: 'Carlos Eduardo', insumo: 'PETG Vermelho', valor: 68.00, status: 'novo', foto: '🪴', prazo: '2026-10-02', rastreio: '', obs: 'Cor Vermelho Ruby' },
            { id: 2, origem: 'Shopee', codigo: '#SHP-9821', sku: 'PRD-001', produto: 'Suporte Headset PS5', cliente: 'Ana Maria', insumo: 'PLA Preto', valor: 45.00, status: 'producao', foto: '🎧', prazo: '2026-09-30', rastreio: '', obs: 'Troca de camada 45' },
            { id: 3, origem: 'Site Próprio', codigo: '#WEB-3021', sku: 'PRD-003', produto: 'Base Action Figure Diorama', cliente: 'Marcos Paulo', insumo: 'PLA Branco', valor: 120.00, status: 'embalagem', foto: '🏰', prazo: '2026-10-01', rastreio: '', obs: 'Embalar para presente' },
            { id: 4, origem: 'WhatsApp', codigo: '#WTS-0042', sku: 'PRD-004', produto: 'Engrenagem Personalizada', cliente: 'Oficina Mecânica', insumo: 'ABS Cinza', valor: 35.00, status: 'envio', foto: '⚙️', prazo: '2026-09-29', rastreio: 'BR982341203', obs: 'Retirada na coleta' }
        ];
        salvarPedidosLocal();
    }
    renderizarKanban();
}

function salvarPedidosLocal() {
    localStorage.setItem('3dcontrol_pedidos', JSON.stringify(pedidos));
}

function renderizarKanban() {
    const colunas = ['novo', 'producao', 'embalagem', 'envio', 'concluido'];
    colunas.forEach(c => {
        const el = document.getElementById('coluna-' + c);
        if (el) el.innerHTML = '';
    });

    let contadores = { novo: 0, producao: 0, embalagem: 0, envio: 0, concluido: 0 };

    pedidos.forEach(p => {
        if (contadores[p.status] !== undefined) contadores[p.status]++;
        const cardHTML = criarCardHTML(p);
        const target = document.getElementById(`coluna-${p.status}`);
        if (target) target.innerHTML += cardHTML;
    });

    colunas.forEach(c => {
        const countEl = document.getElementById('count-' + c);
        if (countEl) countEl.innerText = contadores[c];
    });

    const totalText = document.getElementById('total-pedidos-text');
    if (totalText) totalText.innerText = `${pedidos.length} pedidos ativos no sistema`;
}

function criarCardHTML(p) {
    const estilosOrigem = {
        'Shopee': { bg: 'bg-shopee', text: 'text-white' },
        'Mercado Livre': { bg: 'bg-amber-400', text: 'text-black' },
        'Site Próprio': { bg: 'bg-site', text: 'text-white' },
        'WhatsApp': { bg: 'bg-wts', text: 'text-black' }
    };

    const estilo = estilosOrigem[p.origem] || { bg: 'bg-slate-700', text: 'text-white' };
    
    let proximoStatus = '';
    let textoBotao = '';
    if(p.status === 'novo') { proximoStatus = 'producao'; textoBotao = 'Imprimir ➔'; }
    else if(p.status === 'producao') { proximoStatus = 'embalagem'; textoBotao = 'Acabamento ➔'; }
    else if(p.status === 'embalagem') { proximoStatus = 'envio'; textoBotao = 'Aguardar Envio ➔'; }
    else if(p.status === 'envio') { proximoStatus = 'concluido'; textoBotao = 'Concluir ➔'; }

    return `
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md hover:border-indigo-500/50 transition flex flex-col justify-between gap-3 relative group">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${estilo.bg} ${estilo.text}">${p.origem}</span>
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs text-slate-400 font-mono">${p.codigo || '#PEDIDO'}</span>
                        <button onclick="editarPedido('${p.id}')" title="Editar Pedido" class="text-slate-400 hover:text-indigo-400 p-1 rounded hover:bg-slate-800 transition">✏️</button>
                        <button onclick="excluirPedido('${p.id}')" title="Excluir Pedido" class="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition">🗑️</button>
                    </div>
                </div>
                
                <div class="flex items-center gap-3 my-1">
                    <div class="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                        ${p.foto || '📦'}
                    </div>
                    <div>
                        <span class="text-[10px] font-bold text-indigo-400 font-mono block">${p.sku || 'SKU'}</span>
                        <h4 class="font-bold text-slate-100 text-sm leading-tight">${p.produto}</h4>
                    </div>
                </div>

                <p class="text-xs text-slate-400 mt-1">Cliente: <span class="text-slate-300 font-medium">${p.cliente}</span></p>

                <div class="flex flex-wrap gap-1.5 mt-2">
                    ${p.insumo ? `<span class="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700/50">🧵 ${p.insumo}</span>` : ''}
                    ${p.prazo ? `<span class="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-md font-semibold border border-slate-700/50">📅 ${p.prazo}</span>` : ''}
                </div>

                ${p.obs ? `<p class="text-[11px] text-slate-400 italic mt-2 bg-slate-950/50 p-1.5 rounded border border-slate-800/80">💬 ${p.obs}</p>` : ''}
                ${p.rastreio ? `<p class="text-[11px] text-emerald-400 font-mono mt-1">🚚 Rastreio: ${p.rastreio}</p>` : ''}
            </div>

            <div class="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-100 font-bold">R$ ${Number(p.valor || 0).toFixed(2)}</span>
                </div>

                ${proximoStatus ? `
                    <button onclick="avancarStatus('${p.id}', '${proximoStatus}')" class="w-full mt-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-[11px] font-bold py-1.5 rounded-lg transition text-center">
                        ${textoBotao}
                    </button>
                ` : `
                    <span class="text-[10px] text-emerald-400 font-bold text-center block pt-1">✓ Pedido Finalizado</span>
                `}
            </div>
        </div>
    `;
}

function renderizarTabelaCatalogo() {
    const container = document.getElementById('tabela-catalogo-container');
    if (!container) return;

    let html = `
        <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                    <th class="p-3">Produto</th>
                    <th class="p-3">Código SKU</th>
                    <th class="p-3">Insumo Padrão</th>
                    <th class="p-3">Preço Base (R$)</th>
                    <th class="p-3 text-right">Ações</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
    `;

    Object.values(catalogoProdutos).forEach(item => {
        html += `
            <tr class="hover:bg-slate-800/30 transition">
                <td class="p-3 flex items-center gap-3 font-semibold text-white">
                    <span class="text-xl">${item.foto}</span>
                    ${item.nome}
                </td>
                <td class="p-3 font-mono text-indigo-400 font-bold">${item.sku}</td>
                <td class="p-3 text-xs text-slate-400">${item.insumo}</td>
                <td class="p-3 font-bold text-emerald-400">R$ ${item.valorBase.toFixed(2)}</td>
                <td class="p-3 text-right space-x-2">
                    <button onclick="alert('Editar SKU ${item.sku}')" class="text-slate-400 hover:text-indigo-400">✏️</button>
                    <button onclick="alert('Excluir SKU ${item.sku}')" class="text-slate-400 hover:text-red-400">🗑️</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function avancarStatus(id, novoStatus) {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('pedidos').update({ status: novoStatus }).eq('id', id);
        } catch(e) {}
    }
    const p = pedidos.find(item => item.id == id);
    if (p) p.status = novoStatus;
    salvarPedidosLocal();
    renderizarKanban();
}

function autoPreencherProduto() {
    const sku = document.getElementById('input-produto-sku').value;
    if (sku && catalogoProdutos[sku]) {
        document.getElementById('input-valor').value = catalogoProdutos[sku].valorBase.toFixed(2);
        if (!document.getElementById('input-insumo').value) {
            document.getElementById('input-insumo').value = catalogoProdutos[sku].insumo;
        }
    }
}

function abrirModalNovoPedido() {
    pedidoEmEdicaoId = null;
    document.getElementById('modal-titulo').innerText = '🛍️ Cadastrar Novo Pedido';
    document.getElementById('form-pedido').reset();
    document.getElementById('modal-novo-pedido').classList.remove('hidden');
}

function fecharModalNovoPedido() {
    document.getElementById('modal-novo-pedido').classList.add('hidden');
    pedidoEmEdicaoId = null;
}

function editarPedido(id) {
    const p = pedidos.find(item => item.id == id);
    if (!p) return;

    pedidoEmEdicaoId = id;
    document.getElementById('modal-titulo').innerText = '✏️ Editar Pedido ' + (p.codigo || '');
    
    document.getElementById('input-origem').value = p.origem || 'Shopee';
    document.getElementById('input-produto-sku').value = p.sku || '';
    document.getElementById('input-cliente').value = p.cliente || '';
    document.getElementById('input-codigo').value = p.codigo || '';
    document.getElementById('input-valor').value = p.valor || '';
    document.getElementById('input-insumo').value = p.insumo || '';
    document.getElementById('input-prazo').value = p.prazo || '';
    document.getElementById('input-rastreio').value = p.rastreio || '';
    document.getElementById('input-obs').value = p.obs || '';

    document.getElementById('modal-novo-pedido').classList.remove('hidden');
}

async function excluirPedido(id) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('pedidos').delete().eq('id', id);
        } catch(e) {}
    }

    pedidos = pedidos.filter(item => item.id != id);
    salvarPedidosLocal();
    renderizarKanban();
}

async function salvarNovoPedido(event) {
    event.preventDefault();
    const sku = document.getElementById('input-produto-sku').value;
    const prod = catalogoProdutos[sku] || { nome: 'Produto Personalizado', insumo: 'PLA Standard', foto: '📦' };

    const dadosPedido = {
        origem: document.getElementById('input-origem').value,
        sku: sku,
        produto: prod.nome,
        foto: prod.foto,
        insumo: document.getElementById('input-insumo').value || prod.insumo,
        cliente: document.getElementById('input-cliente').value,
        codigo: document.getElementById('input-codigo').value || `#PED-${Math.floor(Math.random() * 9000 + 1000)}`,
        valor: parseFloat(document.getElementById('input-valor').value) || 0,
        prazo: document.getElementById('input-prazo').value || '',
        rastreio: document.getElementById('input-rastreio').value || '',
        obs: document.getElementById('input-obs').value || ''
    };

    if (pedidoEmEdicaoId) {
        const index = pedidos.findIndex(item => item.id == pedidoEmEdicaoId);
        if (index !== -1) {
            pedidos[index] = { ...pedidos[index], ...dadosPedido };
        }
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                await supabaseClient.from('pedidos').update(dadosPedido).eq('id', pedidoEmEdicaoId);
            } catch(e) {}
        }
    } else {
        const novo = {
            id: Date.now(),
            status: 'novo',
            ...dadosPedido
        };

        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                await supabaseClient.from('pedidos').insert([novo]);
            } catch(e) {}
        }
        pedidos.unshift(novo);
    }

    salvarPedidosLocal();
    renderizarKanban();
    fecharModalNovoPedido();
}