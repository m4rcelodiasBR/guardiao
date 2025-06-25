$(function() {

    if (userRole !== 'ADMIN') {
        alert('Acesso negado. Você não tem permissão para visualizar esta página.');
        window.location.href = '/index.html';
        return;
    }

    // --- SELETORES ---
    const $tabelaUsuariosBody = $('#tabela-usuarios');
    const $formNovoUsuario = $('#form-novo-usuario');
    const $formEditarUsuario = $('#form-editar-usuario');
    const $btnAbrirModal = $('#btn-abrir-modal-novo-usuario');
    const $btnLogout = $('#btn-logout');
    const $themeToggler = $('#theme-toggler');
    const $btnConfirmarAcaoUsuario = $('#btn-confirmar-acao-usuario');

    const modalNovoUsuario = new bootstrap.Modal(document.getElementById('modalNovoUsuario'));
    const modalEditarUsuario = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    const modalConfirmacaoUsuario = new bootstrap.Modal(document.getElementById('modalConfirmacaoUsuario'));

    // --- VARIÁVEIS DE ESTADO ---
    let acaoConfirmada = null;
    let allUsers = [];

    // --- FUNÇÕES ---
    const showAlert = (message, type = 'success') => {
        const $alert = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; bottom: 20px; right: 20px; z-index: 2050;">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
        $('body').append($alert);
        setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 4000);
    };

    const fetchAndDisplayUsers = () => {
        $.ajax({
            url: '/api/usuarios/visiveis',
            method: 'GET',
            success: function(users) {
                allUsers = users;
                $tabelaUsuariosBody.empty();
                users.forEach(user => {
                    const isAtivo = user.status === 'ATIVO';

                    let statusBadge = isAtivo
                        ? '<span class="badge rounded-pill text-bg-success">Ativo</span>'
                        : '<span class="badge rounded-pill text-bg-secondary">Inativo</span>';

                    const perfilBadge = user.perfil === 'ADMIN'
                        ? '<span class="badge rounded-pill text-bg-primary">Administrador</span>'
                        : '<span class="badge rounded-pill text-bg-secondary">Usuário</span>';

                    const isSelf = user.id === loggedInUserId;
                    const disabledAttr = isSelf ? 'hidden' : '';

                    const btnResetSenha = isAtivo ?
                        `<button class="btn btn-sm btn-secondary btn-reset-senha opacity-100" title="Resetar Senha" data-id="${user.id}" data-nome="${user.nome}" ${disabledAttr}>
                            <i class="bi bi-key-fill"></i>
                        </button>` : '';

                    const btnEditar = `<button class="btn btn-sm btn-primary btn-editar-usuario opacity-100" title="Editar" data-id="${user.id}" ${disabledAttr}>
                                        <i class="bi bi-pencil-fill"></i>
                                      </button>`;

                    const btnExcluir = `<button class="btn btn-sm btn-danger btn-excluir-usuario opacity-100" title="Excluir" data-id="${user.id}" data-nome="${user.nome}" ${disabledAttr}>
                                        <i class="bi bi-trash3-fill"></i>
                                       </button>`;

                    const rowHtml = `
                        <tr>
                            <td class="${!isAtivo ? 'opacity-50' : ''}">${user.login}</td>
                            <td class="${!isAtivo ? 'opacity-50' : ''}">${user.nome}</td>
                            <td class="${!isAtivo ? 'opacity-50' : ''}">${user.email}</td>
                            <td class="${!isAtivo ? 'opacity-50' : ''}">${perfilBadge}</td>
                            <td class="${!isAtivo ? 'opacity-50' : ''}">${statusBadge}</td>
                            <td>
                                ${btnResetSenha}
                                ${btnEditar}
                                ${btnExcluir}
                            </td>
                        </tr>
                    `;
                    $tabelaUsuariosBody.append(rowHtml);
                });
            },
            error: function() {
                $tabelaUsuariosBody.html('<tr><td colspan="5" class="text-center text-danger">Erro ao carregar usuários.</td></tr>');
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

    $('body').on('click', '.btn-editar-usuario', function() {
        const userId = $(this).data('id');
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            $('#edit-usuario-id').val(user.id);
            $('#edit-usuario-login').val(user.login);
            $('#edit-usuario-nome').val(user.nome);
            $('#edit-usuario-email').val(user.email);
            $('#edit-usuario-perfil').val(user.perfil);
            $('#edit-usuario-status').val(user.status);
            modalEditarUsuario.show();
        }
    });

    $('body').on('click', '.btn-excluir-usuario', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('nome');
        $('#confirm-title-usuario').text('Confirmar Exclusão');
        $('#confirm-body-usuario').text(`Tem certeza que deseja EXCLUIR o usuário ${userName}? Ele será removido da lista e não poderá mais ser recuperado.`);
        acaoConfirmada = () => handleExcluir(userId);
        modalConfirmacaoUsuario.show();
    });

    $('body').on('click', '.btn-reset-senha', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('nome');
        $('#confirm-title-usuario').text('Confirmar Reset de Senha');
        $('#confirm-body-usuario').text(`Tem certeza que deseja resetar a senha do usuário ${userName}? A nova senha padrão será "guardiao".`);
        acaoConfirmada = () => handleResetSenha(userId);
        modalConfirmacaoUsuario.show();
    });

    $btnConfirmarAcaoUsuario.on('click', function() {
        if (typeof acaoConfirmada === 'function') { acaoConfirmada(); }
        modalConfirmacaoUsuario.hide();
        acaoConfirmada = null;
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
                showAlert(xhr.responseJSON?.message || 'Erro ao cadastrar usuário.', 'danger');
            }
        });
    });

    $formEditarUsuario.on('submit', function(e) {
        e.preventDefault();
        const userId = $('#edit-usuario-id').val();
        const data = {
            login: $('#edit-usuario-login').val(),
            nome: $('#edit-usuario-nome').val(),
            email: $('#edit-usuario-email').val(),
            perfil: $('#edit-usuario-perfil').val(),
            status: $('#edit-usuario-status').val()
        };
        $.ajax({
            url: `/api/usuarios/${userId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Usuário atualizado com sucesso!');
                modalEditarUsuario.hide();
                fetchAndDisplayUsers();
            },
            error: function() { showAlert('Erro ao atualizar usuário.', 'danger'); }
        });
    });

    // --- FUNÇÕES DE AJAX PARA AÇÕES ---
    const handleExcluir = (id) => {
        $.ajax({
            url: `/api/usuarios/${id}`,
            method: 'DELETE',
            success: function() {
                showAlert('Usuário excluído com sucesso.');
                fetchAndDisplayUsers();
            },
            error: function() { showAlert('Erro ao excluir usuário.', 'danger'); }
        });
    };

    const handleResetSenha = (id) => {
        $.ajax({
            url: `/api/usuarios/${id}/reset-senha`,
            method: 'POST',
            success: function() {
                showAlert('Senha do usuário resetada para "guardiao".');
            },
            error: function() { showAlert('Erro ao resetar a senha.', 'danger'); }
        });
    };

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