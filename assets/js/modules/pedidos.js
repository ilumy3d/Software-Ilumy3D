const catalogoProdutos = {
    'PRD-001': { sku: 'PRD-001', nome: 'Suporte Headset PS5', insumo: 'PLA Preto (120g)', valorBase: 45.00, foto: '🎧' },
    'PRD-002': { sku: 'PRD-002', nome: 'Vasinho Decorativo LowPoly', insumo: 'PETG Vermelho (85g)', valorBase: 68.00, foto: '🪴' },
    'PRD-003': { sku: 'PRD-003', nome: 'Base Action Figure Diorama', insumo: 'PLA Branco (210g)', valorBase: 120.00, foto: '🏰' },
    'PRD-004': { sku: 'PRD-004', nome: 'Engrenagem Personalizada', insumo: 'ABS Cinza (50g)', valorBase: 35.00, foto: '⚙️' }
};

let pedidos = [];

window.onload = function() {
    if (localStorage.getItem('3dcontrol_logado') === 'true') {
        const emailSalvo = localStorage.getItem('3dcontrol_email') || 'renato.rustiguelli@gmail.com';
        exibirApp(emailSalvo);
    }
};

async function fazerLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const senha = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error');

    errorBox.classList.add('hidden');

    if (!email || !senha) {
        errorBox.innerText = "Por favor, preencha o e-mail e a senha.";
        errorBox.classList.remove('hidden');
        return;
    }

    const adminsAutorizados = ['renato.rustiguelli@gmail.com', 'gaheustaquio@gmail.com'];

    if (!adminsAutorizados.includes(email)) {
        errorBox.innerText = "E-mail não autorizado para acesso administrativo.";
        errorBox.classList.remove('hidden');
        return;
    }

    if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
        if (error) {
            errorBox.innerText = "E-mail ou senha incorretos no Supabase.";
            errorBox.classList.remove('hidden');
            return;
        }
    }

    localStorage.setItem('3dcontrol_logado', 'true');
    localStorage.setItem('3dcontrol_email', email);
    exibirApp(email);
}

function fazerLogout() {
    localStorage.removeItem('3dcontrol_logado');
    localStorage.removeItem('3dcontrol_email');
    if (supabaseClient) supabaseClient.auth.signOut();
    document.getElementById('screen-app').classList.add('hidden');
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('login-password').value = '';
}

function exibirApp(email) {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    document.getElementById('user-display').innerText = email;
    carregarPedidos();
}

async function carregarPedidos() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            pedidos = data;
            renderizarKanban();
            return;
        }
    }
    
    const salvos = localStorage.getItem('3dcontrol_pedidos');
    if (salvos) {
        pedidos = JSON.parse(salvos);
    } else {
        pedidos = [
            { id: 1, origem: 'Mercado Livre', codigo: '#ML-10492', sku: 'PRD-002', produto: 'Vasinho Decorativo LowPoly', cliente: 'Carlos Eduardo', insumo: 'PETG Vermelho (85g)', valor: 68.00, status: 'novo', foto: '🪴' },
            { id: 2, origem: 'Shopee', codigo: '#SHP-9821', sku: 'PRD-001', produto: 'Suporte Headset PS5', cliente: 'Ana Maria', insumo: 'PLA Preto (120g)', valor: 45.00, status: 'producao', foto: '🎧' },
            { id: 3, origem: 'Site Próprio', codigo: '#WEB-3021', sku: 'PRD-003', produto: 'Base Action Figure Diorama', cliente: 'Marcos Paulo', insumo: 'PLA Branco (210g)', valor: 120.00, status: 'embalagem', foto: '🏰' },
            { id: 4, origem: 'WhatsApp', codigo: '#WTS-0042', sku: 'PRD-004', produto: 'Engrenagem Personalizada', cliente: 'Oficina Mecânica', insumo: 'ABS Cinza (50g)', valor: 35.00, status: 'envio', foto: '⚙️' }
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
    colunas.forEach(c => document.getElementById('coluna-' + c).innerHTML = '');

    let contadores = { novo: 0, producao: 0, embalagem: 0, envio: 0, concluido: 0 };

    pedidos.forEach(p => {
        if (contadores[p.status] !== undefined) contadores[p.status]++;
        const cardHTML = criarCardHTML(p);
        const target = document.getElementById(`coluna-${p.status}`);
        if (target) target.innerHTML += cardHTML;
    });

    colunas.forEach(c => document.getElementById('count-' + c).innerText = contadores[c]);
    document.getElementById('total-pedidos-text').innerText = `${pedidos.length} pedidos ativos na fila de produção`;
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
    else if(p.status === 'envio') { proximoStatus = 'concluido'; textoBotao = 'Enviar ➔'; }

    return `
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md hover:border-indigo-500/50 transition flex flex-col justify-between gap-3">
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${estilo.bg} ${estilo.text}">${p.origem}</span>
                    <span class="text-xs text-slate-400 font-mono">${p.codigo || '#PEDIDO'}</span>
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
            </div>

            <div class="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-100 font-bold">R$ ${Number(p.valor).toFixed(2)}</span>
                    <span class="text-slate-400 text-[11px] font-medium">${p.insumo || ''}</span>
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

async function avancarStatus(id, novoStatus) {
    if (supabaseClient) {
        const { error } = await supabaseClient.from('pedidos').update({ status: novoStatus }).eq('id', id);
        if (!error) {
            await carregarPedidos();
            return;
        }
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
    }
}

function abrirModalNovoPedido() {
    document.getElementById('modal-novo-pedido').classList.remove('hidden');
}

function fecharModalNovoPedido() {
    document.getElementById('modal-novo-pedido').classList.add('hidden');
}

async function salvarNovoPedido(event) {
    event.preventDefault();
    const sku = document.getElementById('input-produto-sku').value;
    const prod = catalogoProdutos[sku] || { nome: 'Produto Personalizado', insumo: 'PLA Standard', foto: '📦' };

    const novo = {
        id: Date.now(),
        origem: document.getElementById('input-origem').value,
        sku: sku,
        produto: prod.nome,
        foto: prod.foto,
        insumo: prod.insumo,
        cliente: document.getElementById('input-cliente').value,
        codigo: document.getElementById('input-codigo').value || `#PED-${Math.floor(Math.random() * 9000 + 1000)}`,
        valor: parseFloat(document.getElementById('input-valor').value),
        status: 'novo'
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('pedidos').insert([novo]);
        if (!error) {
            await carregarPedidos();
            fecharModalNovoPedido();
            return;
        }
    }

    pedidos.unshift(novo);
    salvarPedidosLocal();
    renderizarKanban();
    fecharModalNovoPedido();
}