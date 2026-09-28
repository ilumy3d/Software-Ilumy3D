// ==========================================
// MÓDULO DE AUTENTICAÇÃO E SESSÃO (ILUMY3D)
// ==========================================

window.onload = function() {
    if (localStorage.getItem('3dcontrol_logado') === 'true') {
        const emailSalvo = localStorage.getItem('3dcontrol_email') || 'renato.rustiguelli@gmail.com';
        exibirApp(emailSalvo);
    }
};

async function fazerLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const senha = passwordInput.value;

    if (errorBox) errorBox.classList.add('hidden');

    if (!email || !senha) {
        if (errorBox) {
            errorBox.innerText = "Por favor, preencha o e-mail e a senha.";
            errorBox.classList.remove('hidden');
        }
        return;
    }

    const adminsAutorizados = ['renato.rustiguelli@gmail.com', 'gaheustaquio@gmail.com'];

    if (!adminsAutorizados.includes(email)) {
        if (errorBox) {
            errorBox.innerText = "E-mail não autorizado para acesso administrativo.";
            errorBox.classList.remove('hidden');
        }
        return;
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
        if (error) {
            if (errorBox) {
                errorBox.innerText = "E-mail ou senha incorretos no Supabase.";
                errorBox.classList.remove('hidden');
            }
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
    if (typeof supabaseClient !== 'undefined' && supabaseClient) supabaseClient.auth.signOut();
    
    document.getElementById('screen-app').classList.add('hidden');
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('login-password').value = '';
}

function exibirApp(email) {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-app').classList.remove('hidden');
    document.getElementById('user-display').innerText = email;
    
    // Inicia o carregamento dos pedidos quando entra no app
    if (typeof carregarPedidos === 'function') {
        carregarPedidos();
    }
}