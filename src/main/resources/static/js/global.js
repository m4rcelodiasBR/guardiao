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
const loggedInUserName = userData ? userData.sub.split(',')[1] : null;

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

const updateThemeIcon = (theme) => {
    const $themeIcon = $('#theme-icon');
    if (theme === 'dark') {
        $themeIcon.removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
    } else {
        $themeIcon.removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
    }
};

const setupGlobalUI = (role) => {
    if (role === 'ADMIN') {
        $('#link-gestao-usuarios').show();
    } else {
        $('#link-gestao-usuarios').hide();
    }
};

(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
})();

// --- EVENTOS GLOBAIS ---
$(function() {
    $("#navbar-placeholder").load("navbar.html", function() {
        $('#btn-logout').on('click', function() {
            localStorage.removeItem('jwt_token');
            window.location.href = '/login.html';
        });

        $('#btn-theme-toggler').on('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            updateThemeIcon(newTheme);
        });

        let currentPath = window.location.pathname;
        if(currentPath.endsWith('/')) {
            currentPath += 'index.html';
        }
        $('#main-nav .nav-link').each(function() {
            if ($(this).attr('href').endsWith(currentPath)) {
                $(this).addClass('active');
            }
        });

        if(loggedInUserName) {
            $('#username-display').text(loggedInUserName);
        }

        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        updateThemeIcon(currentTheme);

        setupGlobalUI(userRole);
    });
});