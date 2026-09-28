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
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');

    if (errorBox) errorBox.classList.add('hidden');

    if (!emailInput || !passwordInput) {
        if (errorBox) {
            errorBox.innerText = "Campos do formulário não encontrados.";
            errorBox.classList.remove('hidden');
        }
        return false;
    }

    const email = emailInput.value.trim().toLowerCase();
    const senha = passwordInput.value;

    if (!email || !senha) {
        if (errorBox) {
            errorBox.innerText = "Por favor, preencha o e-mail e a senha.";
            errorBox.classList.remove('hidden');
        }
        return false;
    }

    const adminsAutorizados = ['renato.rustiguelli@gmail.com', 'gaheustaquio@gmail.com'];

    if (!adminsAutorizados.includes(email)) {
        if (errorBox) {
            errorBox.innerText = "E-mail não autorizado para acesso administrativo.";
            errorBox.classList.remove('hidden');
        }
        return false;
    }

    // Tenta autenticação via Supabase Client
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
            if (error) {
                if (errorBox) {
                    errorBox.innerText = "E-mail ou senha incorretos no Supabase: " + error.message;
                    errorBox.classList.remove('hidden');
                }
                return false;
            }
        }
    } catch (err) {
        console.warn("Aviso na conexão Supabase, procedendo com validação local autorizada.", err);
    }

    // Sucesso na autenticação
    localStorage.setItem('3dcontrol_logado', 'true');
    localStorage.setItem('3dcontrol_email', email);
    exibirApp(email);
    return false;
}

function fazerLogout() {
    localStorage.removeItem('3dcontrol_logado');
    localStorage.removeItem('3dcontrol_email');
    
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            supabaseClient.auth.signOut();
        }
    } catch(e) {
        console.log("Logout local efetuado.");
    }
    
    const appScreen = document.getElementById('screen-app');
    const loginScreen = document.getElementById('screen-login');
    const passInput = document.getElementById('login-password');

    if (appScreen) appScreen.classList.add('hidden');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (passInput) passInput.value = '';
}

function exibirApp(email) {
    const loginScreen = document.getElementById('screen-login');
    const appScreen = document.getElementById('screen-app');
    const userDisp = document.getElementById('user-display');

    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) appScreen.classList.remove('hidden');
    if (userDisp) userDisp.innerText = email;
    
    // Inicia o carregamento dos pedidos quando entra no app
    if (typeof carregarPedidos === 'function') {
        carregarPedidos();
    }
}