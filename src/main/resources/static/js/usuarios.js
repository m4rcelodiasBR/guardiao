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
    const $btnConfirmarAcaoUsuario = $('#btn-confirmar-acao-usuario');
    const $paginationControls = $('#pagination-controls-usuarios');
    const $paginationNav = $('#pagination-nav-usuarios');
    const $pageInfo = $('#page-info-usuarios');
    const $pageSizeSelect = $('#page-size-select-usuarios');

    const modalNovoUsuario = new bootstrap.Modal(document.getElementById('modalNovoUsuario'));
    const modalEditarUsuario = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    const modalConfirmacaoUsuario = new bootstrap.Modal(document.getElementById('modalConfirmacaoUsuario'));

    // --- VARIÁVEIS DE ESTADO ---
    let acaoConfirmada = null;
    let allUsers = [];
    let currentPage = 0;

    // --- FUNÇÕES ---
    const fetchAndDisplayUsers = (page = 0, size = 10) => {
        const $overlay = $('.table-loading-overlay');
        $.ajax({
            url: `/api/usuarios/visiveis?page=${page}&size=${size}&sort=nome,asc`,
            method: 'GET',
            beforeSend: function() {
                $overlay.removeClass('d-none');
            },
            success: function(pageData) {
                allUsers = pageData.content;
                renderTable(allUsers);
                currentPage = pageData.number;
                renderPaginationControls(pageData);
            },
            error: function() {
                $tabelaUsuariosBody.html('<tr><td colspan="6" class="text-center text-danger">Erro ao carregar utilizadores.</td></tr>');
                $paginationControls.hide();
            },
            complete: function() {
                $overlay.addClass('d-none');
            }
        });
    };

    const renderPaginationControls = (pageData) => {
        $paginationNav.empty();
        if (pageData.totalPages <= 1) {
            $paginationControls.hide();
            return;
        }
        $paginationControls.show();
        const totalItems = pageData.totalElements;
        const pageNumber = pageData.number;
        const pageSize = pageData.size;
        const startItem = totalItems > 0 ? (pageNumber * pageSize) + 1 : 0;
        const endItem = Math.min(startItem + pageSize - 1, totalItems);
        $pageInfo.text(`Exibindo ${startItem}-${endItem} de ${totalItems} utilizadores`);
        $paginationNav.append(`
            <li class="page-item ${pageData.first ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pageNumber - 1}">Anterior</a>
            </li>`);
        for (let i = 0; i < pageData.totalPages; i++) {
            $paginationNav.append(`
            <li class="page-item ${i === pageNumber ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
            </li>`);
        }
        $paginationNav.append(`
            <li class="page-item ${pageData.last ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pageNumber + 1}">Próximo</a>
            </li>`);
    };

    const renderTable = (users) => {
        $tabelaUsuariosBody.empty();
        users.forEach(user => {
            const isAtivo = user.status === 'ATIVO';
            let statusBadge = isAtivo ? '<span class="badge rounded-pill text-bg-success">Ativo</span>' : '<span class="badge rounded-pill text-bg-secondary">Inativo</span>';
            const perfilBadge = user.perfil === 'ADMIN' ? '<span class="badge rounded-pill text-bg-primary">Administrador</span>' : '<span class="badge rounded-pill text-bg-info">Usuário</span>';

            const isSelf = user.id === loggedInUserId;
            const disabledAttr = isSelf ? 'hidden' : '';

            const btnResetSenha = isAtivo ? `<button class="btn btn-sm btn-secondary btn-reset-senha opacity-100" title="Resetar Senha" data-id="${user.id}" data-nome="${user.nome}" ${disabledAttr}><i class="bi bi-key-fill"></i></button>` : '';
            const btnEditar = `<button class="btn btn-sm btn-primary btn-editar-usuario opacity-100" title="Editar" data-id="${user.id}" ${disabledAttr}><i class="bi bi-pencil-fill"></i></button>`;
            const btnExcluir = `<button class="btn btn-sm btn-danger btn-excluir-usuario opacity-100" title="Excluir" data-id="${user.id}" data-nome="${user.nome}" ${disabledAttr}><i class="bi bi-trash3-fill"></i></button>`;

            const rowHtml = `
                <tr class="${!isAtivo ? 'opacity-50' : ''}">
                    <td>${user.login}</td>
                    <td>${user.nome}</td>
                    <td>${user.email}</td>
                    <td>${perfilBadge}</td>
                    <td>${statusBadge}</td>
                    <td>${btnResetSenha} ${btnEditar} ${btnExcluir}</td>
                </tr>`;
            $tabelaUsuariosBody.append(rowHtml);
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
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
        const formDataArray = $(this).serializeArray();
        let data = {};
        formDataArray.forEach(item => { data[item.name] = item.value; });
        $.ajax({
            url: '/api/usuarios',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert('Usuário cadastrado com sucesso!');
                modalNovoUsuario.hide();
                fetchAndDisplayUsers();
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || 'Erro ao cadastrar usuário.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Usuário');
            }
        });
    });

    $formEditarUsuario.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
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
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert('Usuário atualizado com sucesso!');
                modalEditarUsuario.hide();
                fetchAndDisplayUsers(currentPage);
            },
            error: function() {
                showAlert('Erro ao atualizar usuário.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Alterações');
            }
        });
    });

    $paginationNav.on('click', 'a.page-link', function(e) {
        e.preventDefault();
        if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) { return; }
        const page = $(this).data('page');
        fetchAndDisplayUsers(page, $pageSizeSelect.val());
    });

    $pageSizeSelect.on('change', function() {
        fetchAndDisplayUsers(0, $(this).val());
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

    // --- INICIALIZAÇÃO ---
    fetchAndDisplayUsers();
});