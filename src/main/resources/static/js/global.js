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
    const toastConfig = {
        success: {
            bgClass: 'text-bg-success',
            iconClass: 'bi-check-circle-fill'
        },
        danger: {
            bgClass: 'text-bg-danger',
            iconClass: 'bi-x-circle-fill'
        },
        warning: {
            bgClass: 'text-bg-warning',
            iconClass: 'bi-exclamation-triangle-fill'
        },
        info: {
            bgClass: 'text-bg-info',
            iconClass: 'bi-info-circle-fill'
        }
    };

    const config = toastConfig[type] || toastConfig.info;

    const toastId = 'toast-' + Date.now();

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${config.bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${config.iconClass} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    $('.toast-container').append(toastHtml);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: 5000 // O toast some após 5 segundos
    });

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
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
    const $scrollToTopButton = $('#btn-scroll-to-top');

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

    $scrollToTopButton.on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 'smooth');
    });

    $(window).on('scroll', function() {
        // Se o usuário rolou mais de 200 pixels para baixo
        if ($(this).scrollTop() > 200) {
            // Adiciona a classe .show para tornar o botão visível com fade-in
            $scrollToTopButton.addClass('show');
        } else {
            // Senão, remove a classe para esconder o botão com fade-out
            $scrollToTopButton.removeClass('show');
        }
    });
});