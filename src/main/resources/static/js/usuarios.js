$(function() {

    // --- SELETORES ---
    const $tabelaUsuariosBody = $('#tabela-usuarios');
    const $formNovoUsuario = $('#form-novo-usuario');
    const $btnAbrirModal = $('#btn-abrir-modal-novo-usuario');
    const $btnLogout = $('#btn-logout');
    const $themeToggler = $('#theme-toggler');
    const modalNovoUsuario = new bootstrap.Modal(document.getElementById('modalNovoUsuario'));

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
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const userData = parseJwt(token);
    const userRole = userData ? userData.role : null;

    // Apenas ADMINs podem acessar esta página
    if (userRole !== 'ADMIN') {
        alert('Acesso negado. Você não tem permissão para visualizar esta página.');
        window.location.href = '/index.html';
        return;
    }

    // --- CONFIGURAÇÃO GLOBAL DO AJAX (A PEÇA QUE FALTAVA) ---
    $.ajaxSetup({
        headers: { 'Authorization': 'Bearer ' + token },
        error: function(xhr) {
            if (xhr.status === 401 || xhr.status === 403) {
                localStorage.removeItem('jwt_token');
                window.location.href = '/login.html';
            }
        }
    });

    // --- FUNÇÕES ---
    const showAlert = (message, type = 'success') => {
        const $alert = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 2050;">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
        $('body').append($alert);
        setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 4000);
    };

    const fetchAndDisplayUsers = () => {
        $.ajax({
            url: '/api/usuarios',
            method: 'GET',
            success: function(users) {
                $tabelaUsuariosBody.empty();
                users.forEach(user => {
                    const perfilBadge = user.perfil === 'ADMIN'
                        ? '<span class="badge rounded-pill text-bg-primary">Admin</span>'
                        : '<span class="badge rounded-pill text-bg-secondary">Usuário</span>';

                    const rowHtml = `
                        <tr>
                            <td>${user.nome}</td>
                            <td>${user.email}</td>
                            <td>${perfilBadge}</td>
                        </tr>
                    `;
                    $tabelaUsuariosBody.append(rowHtml);
                });
            },
            error: function() {
                $tabelaUsuariosBody.html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar usuários.</td></tr>');
            }
        });
    };

    // --- EVENTOS ---
    $btnLogout.on('click', function() {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    $btnAbrirModal.on('click', function() {
        $formNovoUsuario[0].reset();
        modalNovoUsuario.show();
    });

    $formNovoUsuario.on('submit', function(e) {
        e.preventDefault();

        const formDataArray = $(this).serializeArray();
        let data = {};
        formDataArray.forEach(item => { data[item.name] = item.value; });

        $.ajax({
            url: '/api/usuarios',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Usuário cadastrado com sucesso!');
                modalNovoUsuario.hide();
                fetchAndDisplayUsers();
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : 'Erro ao cadastrar usuário.';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // --- MODO ESCURO ---
    const applyTheme = (theme) => {
        $('html').attr('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        $themeToggler.prop('checked', theme === 'dark');
    };
    $themeToggler.on('change', function() { applyTheme($(this).is(':checked') ? 'dark' : 'light'); });


    // --- INICIALIZAÇÃO ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    fetchAndDisplayUsers();
});