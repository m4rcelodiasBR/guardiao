$(document).on('global-setup-complete', function() {

    if (userRole !== 'ADMIN') {
        alert('Acesso negado. Você não tem permissão para visualizar esta página.');
        window.location.href = '/index.html';
        return;
    }

    // --- SELETORES ---
    const $formNovoUsuario = $('#form-novo-usuario');
    const $formEditarUsuario = $('#form-editar-usuario');
    const $btnConfirmarAcaoUsuario = $('#btn-confirmar-acao-usuario');

    const modalNovoUsuario = new bootstrap.Modal(document.getElementById('modalNovoUsuario'));
    const modalEditarUsuario = new bootstrap.Modal(document.getElementById('modalEditarUsuario'));
    const modalConfirmacaoUsuario = new bootstrap.Modal(document.getElementById('modalConfirmacaoUsuario'));

    // --- VARIÁVEIS DE ESTADO ---
    let acaoConfirmada = null;

    // --- FUNÇÕES ---
    const dataTable = $('#datatable-usuarios').DataTable({
        serverSide: true,
        ajax: {
            url: '/api/usuarios/datatable',
            type: 'POST',
            error: function () {
                $("#datatable-usuarios_processing").css("display", "none");
                showAlert('Erro ao carregar dados da tabela.', 'danger');
            }
        },
        columns: [
            { data: 'login' },
            { data: 'nome' },
            { data: 'email' },
            { data: 'perfil',
                render: function (data) {
                    return data === 'ADMIN'
                        ? '<span class="badge rounded-pill text-bg-primary">Administrador</span>'
                        : '<span class="badge rounded-pill text-bg-info">Usuário</span>';
                }
            },
            { data: 'status',
                render: function (data) {
                    return data === 'ATIVO'
                        ? '<span class="badge rounded-pill text-bg-success">Ativo</span>'
                        : '<span class="badge rounded-pill text-bg-secondary">Inativo</span>';
                }
            },
            { data: null,
                orderable: false,
                render: function (data, type, row) {
                    const isSelf = row.id === loggedInUserId;
                    if (isSelf) return '';
                    const btnResetSenha = `<button class="btn btn-xs btn-info btn-reset-senha" title="Resetar Senha" data-id="${row.id}" data-nome="${row.nome}"><i class="bi bi-key-fill"></i></button>`;
                    const btnEditar = `<button class="btn btn-xs btn-primary btn-editar-usuario" title="Editar" data-id="${row.id}"><i class="bi bi-pencil-fill"></i></button>`;
                    const btnExcluir = `<button class="btn btn-xs btn-danger btn-excluir-usuario" title="Excluir" data-id="${row.id}" data-nome="${row.nome}"><i class="bi bi-trash3-fill"></i></button>`;

                    return `${btnResetSenha} ${btnEditar} ${btnExcluir}`;
                }
            }
        ],
        language: { url: '/js/datatables-traducoes/pt-BR.json', },
        responsive: true,
        order: [[1, 'asc']],
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-md-end align-items-center'<'#buttons-title-placeholder'>B>>" +
            "<'row my-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row my-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>",
        buttonsTitle: 'Ações',
        buttons: [
            {
                extend: 'copy',
                text: '<i class="bi bi-copy"></i>',
                titleAttr: 'Copiar linhas visíveis',
                className: 'btn btn-sm btn-secondary',
                exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'}
            },
            {
                extend: 'csv',
                text: '<i class="bi bi-filetype-csv"></i>',
                titleAttr: 'Exportar para CSV',
                className: 'btn btn-sm btn-success',
                exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'}
            },
            {
                extend: 'copy',
                text: '<i class="bi bi-filetype-xlsx"></i>',
                titleAttr: 'Exportar para Excel',
                className: 'btn btn-sm btn-success',
                exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'}
            },
            {
                extend: 'collection',
                text: '<i class="bi bi-filetype-pdf"></i>',
                titleAttr: 'Exportar para PDF',
                className: 'btn btn-sm btn-danger',
                buttons: [
                    {
                        extend: 'pdfHtml5',
                        text: 'Retrato',
                        orientation: 'portrait',
                        pageSize: 'A4',
                        exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'},
                        customize: function (doc) {
                            doc.defaultStyle.fontSize = 10;
                        }
                    },
                    {
                        extend: 'pdfHtml5',
                        text: 'Paisagem',
                        orientation: 'landscape',
                        pageSize: 'A4',
                        exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'},
                        customize: function (doc) {
                            doc.defaultStyle.fontSize = 10;
                        }
                    }
                ]
            },
            {
                extend: 'print',
                text: '<i class="bi bi-printer"></i>',
                titleAttr: 'Imprimir',
                className: 'btn btn-sm btn-info',
                exportOptions: {columns: ':visible:not(:last-child):not(:first-child)'}
            }
        ],
        lengthMenu: [
            [5, 10, 25, 50, 100],
            ['5', '10', '25', '50', '100']
        ],
        pageLength: 5
    });

    dataTable.on('init.dt', function() {
        $('#buttons-title-placeholder').html('<span class="me-2">Exportar:</span>');
    });

    dataTable.on('draw.dt', function () {
        $('.dt-buttons').removeClass('btn-group').addClass('btn-group-sm');
    });

    // --- EVENTOS ---
    $('#btn-abrir-modal-novo-usuario').on('click', function() {
        $formNovoUsuario[0].reset();
        modalNovoUsuario.show();
    });

    $('#datatable-usuarios tbody').on('click', '.btn-editar-usuario', function () {
        const data = dataTable.row($(this).parents('tr')).data();
        if (data) {
            $('#edit-usuario-id').val(data.id);
            $('#edit-usuario-login').val(data.login);
            $('#edit-usuario-nome').val(data.nome);
            $('#edit-usuario-email').val(data.email);
            $('#edit-usuario-perfil').val(data.perfil);
            $('#edit-usuario-status').val(data.status);
            modalEditarUsuario.show();
        }
    });

    $('#datatable-usuarios tbody').on('click', '.btn-excluir-usuario', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('nome');
        $('#confirm-title-usuario').text('Confirmar Exclusão');
        $('#confirm-body-usuario').text(`Tem certeza que deseja EXCLUIR o usuário ${userName}?`);
        $('#btn-confirmar-acao-usuario').removeClass('btn-info').addClass('btn-danger');
        acaoConfirmada = () => handleExcluir(userId);
        modalConfirmacaoUsuario.show();
    });

    $('#datatable-usuarios tbody').on('click', '.btn-reset-senha', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('nome');
        $('#confirm-title-usuario').text('Confirmar Reset de Senha');
        $('#confirm-body-usuario').text(`Tem certeza que deseja resetar a senha do usuário ${userName}? A nova senha padrão será "guardiao".`);
        $('#btn-confirmar-acao-usuario').removeClass('btn-danger').addClass('btn-info');
        acaoConfirmada = () => handleResetSenha(userId);
        modalConfirmacaoUsuario.show();
    });

    $btnConfirmarAcaoUsuario.on('click', function() {
        if (typeof acaoConfirmada === 'function') {
            acaoConfirmada();
        }
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
                dataTable.ajax.reload();
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
                dataTable.ajax.reload(null, false); // Recarrega a página atual da tabela
            },
            error: function() {
                showAlert('Erro ao atualizar usuário.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Alterações');
            }
        });
    });

    // --- FUNÇÕES DE AJAX PARA AÇÕES ---
    const handleExcluir = (id) => {
        $.ajax({
            url: `/api/usuarios/${id}`,
            method: 'DELETE',
            success: function() {
                showAlert('Usuário excluído com sucesso.');
                dataTable.ajax.reload();
            },
            error: function() { showAlert('Erro ao excluir usuário.', 'danger'); }
        });
    };

    const handleResetSenha = (id) => {
        $.ajax({
            url: `/api/usuarios/${id}/reset-senha`,
            method: 'POST',
            success: function() {
                showAlert('Senha do usuário resetada. Será necessário alterar a senha no próximo login.');
            },
            error: function() { showAlert('Erro ao resetar a senha.', 'danger'); }
        });
    };
});