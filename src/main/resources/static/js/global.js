// --- FUNÇÃO AUXILIAR PARA LER O TOKEN ---
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

// --- VERIFICAÇÃO DE AUTENTICAÇÃO E PERMISSÃO ---
const token = localStorage.getItem('jwt_token');
const userData = parseJwt(token);
const userRole = userData ? userData.role : null;
const loggedInUserId = userData ? parseInt(userData.sub.split(',')[0], 10) : null;

// Esta verificação é executada em todas as páginas que carregam este script
if (!token) {
    if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
    }
} else {
    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token
        },
        error: function(xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                localStorage.removeItem('jwt_token');
                window.location.href = '/login.html';
            }
        }
    });
}

// --- FUNÇÕES GLOBAIS ---
const showAlert = (message, type = 'success') => {
    const $alert = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; bottom: 20px; right: 20px; z-index: 2000;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    $('body').append($alert);
    setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 4000);
};

const applyTheme = (theme) => {
    $('html').attr('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    $('#theme-toggler').prop('checked', theme === 'dark');
};

// --- EVENTOS GLOBAIS ---
$(function() {
    $('#btn-logout').on('click', function() {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    // Lógica do tema é global
    $('#theme-toggler').on('change', function() {
        applyTheme($(this).is(':checked') ? 'dark' : 'light');
    });

    // Aplica o tema salvo na inicialização
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
});