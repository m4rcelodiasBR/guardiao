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
        delay: 7000
    });

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });

    toast.show();
};

const updateThemeIcon = (theme) => {
    const $themeIcon = $('#theme-icon');
    if (theme === 'dark') {
        $themeIcon.removeClass('bi-moon-stars-fill')
            .addClass('bi-sun-fill')
            .attr('title','Modo Claro');
    } else {
        $themeIcon.removeClass('bi-sun-fill')
            .addClass('bi-moon-stars-fill')
            .attr('title','Modo Escuro');
    }
};

function loadLayout() {
    // Verifica se os placeholders existem antes de tentar carregar.
    if ($("#navbar-placeholder").length === 0 || $("#footer-placeholder").length === 0) {
        // Se não houver placeholders (ex: página de login), resolve a promise imediatamente.
        return $.Deferred().resolve().promise();
    }

    const navbarRequest = $.get("navbar.html");
    const footerRequest = $.get("footer.html");

    return $.when(navbarRequest, footerRequest).done(function(navbarData, footerData) {
        $("#navbar-placeholder").html(navbarData[0]);
        $("#footer-placeholder").html(footerData[0]);
    });
}

// --- EVENTOS GLOBAIS ---
$(function() {

    loadLayout().then(function() {

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
        if (currentPath.endsWith('/')) {
            currentPath = '/index.html';
        }

        $('#main-nav .nav-link').each(function() {
            const linkHref = $(this).attr('href');
            if (linkHref === currentPath) {
                $(this).addClass('active');
            }
        });

        if (loggedInUserName) {
            $('#username-display').text(loggedInUserName);
        }

        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        updateThemeIcon(currentTheme);

        if (userRole === 'ADMIN') {
            $('#link-gestao-usuarios').show();
        } else {
            $('#link-gestao-usuarios').hide();
        }

        $(document).trigger('global-setup-complete');
    });

    const $scrollToTopButton = $('#btn-scroll-to-top');
    $scrollToTopButton.on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, 'smooth');
    });

    $(window).on('scroll', function() {
        if ($(this).scrollTop() > 200) {
            $scrollToTopButton.addClass('show');
        } else {
            $scrollToTopButton.removeClass('show');
        }
    });

    const modalConteudoDinamico = document.getElementById('modal-conteudo-dinamico');
    if (modalConteudoDinamico) {
        modalConteudoDinamico.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const url = button.getAttribute('data-load-url');
            const title = button.getAttribute('data-modal-title');
            const modalTitle = modalConteudoDinamico.querySelector('.modal-title');
            const modalBody = modalConteudoDinamico.querySelector('.modal-body');
            modalTitle.textContent = title;

            modalBody.innerHTML = '<div class="d-flex justify-content-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div></div>';

            $(modalBody).load(url, function(response, status, xhr) {
                if (status === "error") {
                    modalBody.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteúdo: ${xhr.status} ${xhr.statusText}</div>`;
                }
            });
        });
    }
});