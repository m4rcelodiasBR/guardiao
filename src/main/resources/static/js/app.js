$(function() {

    // Formulários
    const $formBuscaAvancada = $('#form-busca-avancada');
    const $formNovoItem = $('#form-novo-item');

    // Seletores
    const $cabecalhoTabelaInventario = $('#tabela-inventario').closest('table').find('thead');
    const $tabelaInventarioBody = $('#tabela-inventario');
    const $themeToggler = $('#theme-toggler');
    const $selectIncumbencia = $('#transfer-destino-select');
    const $destinoExtraWrapper = $('#destino-extra-wrapper');
    const $inputDestinoExtra = $('#transfer-destino-extra-input');
    const $labelDestinoExtra = $('#label-destino-extra');
    const $btnLogout = $('#btn-logout');

    // Botões
    const $btnLimparBusca = $('#btn-limpar-busca');
    const $btnConfirmarAcao = $('#btn-confirmar-acao');

    // Ações em Massa
    const $selectAllCheckbox = $('#select-all-checkbox');
    const $bulkActionsWrapper = $('#bulk-actions-wrapper');
    const $selectionCounter = $('#selection-counter');
    const $btnExcluirSelecionados = $('#btn-excluir-selecionados');
    const $btnTransferirSelecionados = $('#btn-transferir-selecionados');

    // Modais
    const modalNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));
    const modalTransferencia = new bootstrap.Modal(document.getElementById('modalTransferencia'));
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
    const $formEditarItem = $('#form-editar-item');
    const modalEditarItem = new bootstrap.Modal(document.getElementById('modalEditarItem'));

    // --- VARIÁVEIS DE ESTADO ---
    let allItems = [];
    let acaoConfirmada = null;
    let selectedItems = new Set();
    let currentSort = { column: 'id', direction: 'asc' };

    // --- FUNÇÃO AUXILIAR PARA LER O TOKEN ---
    // Esta função decodifica a parte do meio de um token JWT para ler seus dados.
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    // --- VERIFICAÇÃO DE AUTENTICAÇÃO (EXECUTADO PRIMEIRO) ---
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    };

    const userData = parseJwt(token);
    const userRole = userData ? userData.role : null;

    $.ajaxSetup({
        headers: {
            'Authorization': 'Bearer ' + token
        },
        error: function(xhr) {
            if (xhr.status === 401) {
                localStorage.removeItem('jwt_token');
                window.location.href = '/login.html';
            }
        }
    });

    // --- LÓGICA DE CONTROLE DE ACESSO DA INTERFACE (UI) ---
    const setupUIForRole = (role) => {
        if (role === 'ADMIN') {
            $('#link-gestao-usuarios').show();
        } else {
            $('#link-gestao-usuarios').hide();
            $('#btn-novo-item').hide();
            $('#btn-excluir-selecionados').hide();
            $('#select-all-checkbox').prop('disabled', true);
        }
    };

    // --- FUNÇÕES DE LÓGICA ---
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

    const popularCompartimentos = (selectId, placeholder, selectedValue = null) => {
        const $select = $(selectId);
        $.ajax({
            url: '/api/itens/compartimentos',
            method: 'GET',
            success: function(compartimentos) {
                $select.empty().append(`<option value="">${placeholder}</option>`);
                compartimentos.forEach(c => {
                    const isSelected = c.name === selectedValue ? 'selected' : '';
                    $select.append(`<option value="${c.name}" ${isSelected}>${c.descricao}</option>`);
                });
            },
            error: function() {
                $select.empty().append('<option value="">Erro ao carregar</option>');
            }
        });
    };

    const popularIncumbencias = () => {
        $.ajax({
            url: '/api/util/incumbencias',
            method: 'GET',
            success: function(incumbencias) {
                $selectIncumbencia.empty().append('<option value="">Selecione um destino...</option>');
                incumbencias.forEach(i => {
                    $selectIncumbencia.append(`<option value="${i.codigo}" data-descricao="${i.descricao}">${i.descricao}</option>`);
                });
            },
            error: function() {
                $selectIncumbencia.empty().append('<option value="">Erro ao carregar</option>');
            }
        });
    };

    // Ações em Massa
    const updateBulkActionUI = () => {
        const count = selectedItems.size;
        const $singleActionButtons = $('.btn-editar, .btn-transferir, .btn-excluir');
        if (count > 0) {
            $bulkActionsWrapper.show();
            if (userRole !== 'ADMIN') { $btnExcluirSelecionados.hide(); }
            $selectionCounter.text(`${count} item(s) selecionado(s)`);
            $singleActionButtons.prop('disabled', true).addClass('opacity-50');
        } else {
            $bulkActionsWrapper.hide();
            $singleActionButtons.prop('disabled', false).removeClass('opacity-50');
        }
        $selectAllCheckbox.prop('checked', count > 0 && count === $('.item-checkbox:not(:disabled)').length);
    };

    const fetchAndDisplayItems = (searchParams = {}) => {
        const queryString = $.param(searchParams);

        $.ajax({
            url: `/api/itens?${queryString}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                allItems = data;
                renderTable(allItems);
            },
            error: function(xhr, status, error) {
                console.error("Erro ao buscar itens:", status, error);
                $tabelaInventarioBody.html('<tr><td colspan="9" class="text-center text-danger">Erro ao carregar inventário.</td></tr>');
            }
        });
    };

    const renderTable = () => {
        $tabelaInventarioBody.empty();

        const sortedItems = [...allItems].sort((a, b) => {
            let valA = a[currentSort.column];
            let valB = b[currentSort.column];

            if (currentSort.column === 'compartimento') {
                valA = a.compartimento ? a.compartimento.descricao : '';
                valB = b.compartimento ? b.compartimento.descricao : '';
            } else if (currentSort.column === 'status') {
                valA = a.status || '';
                valB = b.status || '';
            }

            valA = valA || '';
            valB = valB || '';

            return valA.toString().localeCompare(valB.toString()) * (currentSort.direction === 'asc' ? 1 : -1);
        });

        if (sortedItems.length === 0) {
            $tabelaInventarioBody.html('<tr><td colspan="9" class="text-center text-muted">Nenhum item ativo encontrado.</td></tr>');
            return;
        }

        sortedItems.forEach(item => {
            const isDisponivel = item.status === 'DISPONIVEL';
            const compartimentoDesc = item.compartimento ? item.compartimento.descricao : 'N/A';
            let statusBadge = '';
            switch (item.status) {
                case 'DISPONIVEL': statusBadge = '<span class="badge rounded-pill text-bg-success">Disponível</span>'; break;
                case 'TRANSFERIDO': statusBadge = '<span class="badge rounded-pill text-bg-warning">Transferido</span>'; break;
                default: statusBadge = `<span class="badge rounded-pill text-bg-secondary">${item.status}</span>`;
            }
            const acoesDesabilitadas = !isDisponivel ? 'disabled' : '';

            let acoesHtml = '';
            const podeSelecionar = isDisponivel && userRole === 'ADMIN';

            if (userRole === 'ADMIN') {
                acoesHtml = `
                    <button class="btn btn-sm btn-primary btn-editar" title="Editar" data-patrimonio="${item.numeroPatrimonial}" ${acoesDesabilitadas}><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-info btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}" ${acoesDesabilitadas}><i class="bi bi-box-arrow-right"></i></button>
                    <button class="btn btn-sm btn-danger btn-excluir" title="Excluir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}" ${acoesDesabilitadas}><i class="bi bi-trash3-fill"></i></button>
                `;
            } else {
                acoesHtml = `<button class="btn btn-sm btn-info btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}" ${acoesDesabilitadas}><i class="bi bi-box-arrow-right"></i></button>`;
            }

            const rowHtml = `
                <tr class="${!isDisponivel ? 'opacity-50' : ''}">
                    <td><input class="form-check-input item-checkbox" type="checkbox" value="${item.numeroPatrimonial}" ${!podeSelecionar ? 'disabled' : ''}></td>
                    <td>${statusBadge}</td>
                    <td>${item.numeroPatrimonial || 'N/A'}</td>
                    <td>${item.descricao}</td>
                    <td>${item.marca || 'N/A'}</td>
                    <td>${item.numeroDeSerie || 'N/A'}</td>
                    <td>${item.localizacao || 'N/A'}</td>
                    <td>${compartimentoDesc}</td>
                    <td>${acoesHtml}</td>
                </tr>
            `;
            $tabelaInventarioBody.append(rowHtml);
        });
    };

    // --- MANIPULADORES DE EVENTOS ---
    $btnLogout.on('click', function() {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    $cabecalhoTabelaInventario.on('click', 'th[data-sortable]', function() {
        const columnKey = $(this).data('column');
        if (!columnKey) return;
        const direction = (currentSort.column === columnKey && currentSort.direction === 'asc') ? 'desc' : 'asc';
        currentSort = { column: columnKey, direction: direction };
        $cabecalhoTabelaInventario.find('i.sort-icon').remove();
        const iconClass = direction === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
        $(this).append(` <i class="bi ${iconClass} sort-icon text-warning"></i>`);
        renderTable();
    });

    $selectIncumbencia.on('change', function() {
        const selectedOption = $(this).val();
        if (selectedOption === 'OUTRA_OM') {
            $labelDestinoExtra.text('Especificar OM Destino');
            $inputDestinoExtra.prop('required', true);
            $destinoExtraWrapper.slideDown();
        } else if (selectedOption === 'DOACAO') {
            $labelDestinoExtra.text('Especificar Destinatário da Doação');
            $inputDestinoExtra.prop('required', true);
            $destinoExtraWrapper.slideDown();
        } else {
            $destinoExtraWrapper.slideUp();
            $inputDestinoExtra.prop('required', false);
            $inputDestinoExtra.val('');
        }
    });

    $('body').on('click', '.btn-editar', function() {
        const patrimonio = $(this).data('patrimonio');

        $.ajax({
            url: `/api/itens/${patrimonio}`,
            method: 'GET',
            success: function(item) {
                $('#edit-numeroPatrimonial-original').val(item.numeroPatrimonial);
                $('#edit-numeroPatrimonial').val(item.numeroPatrimonial);
                $('#edit-descricao').val(item.descricao);
                $('#edit-marca').val(item.marca);
                $('#edit-numeroDeSerie').val(item.numeroDeSerie);
                $('#edit-localizacao').val(item.localizacao);

                popularCompartimentos('#edit-compartimento', 'Selecione...', item.compartimento);

                modalEditarItem.show();
            },
            error: function() {
                showAlert('Erro ao buscar dados do item para edição.', 'danger');
            }
        });
    });

    $('body').on('click', '.btn-excluir', function() {
        const $button = $(this);
        const patrimonio = $button.data('patrimonio');
        const descricao = $button.data('descricao');
        $('#confirm-title').text('Confirmar Exclusão');
        $('#confirm-body').text(`Tem certeza que deseja excluir o item: ${descricao} (Patrimônio: ${patrimonio})? Esta ação não pode ser desfeita.`);
        acaoConfirmada = () => handleDelete(patrimonio);
        modalConfirmacao.show();
    });

    $('body').on('click', '.btn-transferir', function() {
        const $button = $(this);
        const patrimonio = $button.data('patrimonio');
        const descricao = $button.data('descricao');
        $('#item-a-transferir-descricao').text(descricao);
        $('#transfer-patrimonio').val(patrimonio);
        modalTransferencia.show();
    });

    $btnConfirmarAcao.on('click', function() {
        if (typeof acaoConfirmada === 'function') {
            acaoConfirmada();
        }
        modalConfirmacao.hide();
        acaoConfirmada = null;
    });

    // Eventos para seleção em massa
    $selectAllCheckbox.on('change', function() {
        const isChecked = $(this).is(':checked');
        $('.item-checkbox').prop('checked', isChecked);
        selectedItems.clear();
        if (isChecked) {
            $('.item-checkbox').each(function() {
                selectedItems.add($(this).val());
            });
        }
        updateBulkActionUI();
    });

    $tabelaInventarioBody.on('change', '.item-checkbox', function() {
        const patrimonio = $(this).val();
        if ($(this).is(':checked')) {
            selectedItems.add(patrimonio);
        } else {
            selectedItems.delete(patrimonio);
        }
        updateBulkActionUI();
    });

    $btnExcluirSelecionados.on('click', function() {
        $('#confirm-title').text('Confirmar Exclusão em Massa');
        $('#confirm-body').text(`Tem certeza que deseja excluir os ${selectedItems.size} itens selecionados? Esta ação não pode ser desfeita.`);
        acaoConfirmada = () => handleBulkDelete();
        modalConfirmacao.show();
    });

    $btnTransferirSelecionados.on('click', function() {
        $('#item-a-transferir-descricao').text(`${selectedItems.size} itens selecionados`);
        $('#transfer-patrimonio').val('');
        modalTransferencia.show();
    });

    // --- SUBMISSÃO DOS FORMULÁRIOS ---
    $formNovoItem.on('submit', function(e) {
        e.preventDefault();
        const formDataArray = $(this).serializeArray();
        let data = {};
        formDataArray.forEach(item => {
            if (item.value) { data[item.name] = item.value; }
        });

        $.ajax({
            url: '/api/itens',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Item cadastrado com sucesso!');
                $formNovoItem[0].reset();
                modalNovoItem.hide();
                fetchAndDisplayItems();
            },
            error: function() {
                showAlert('Erro ao cadastrar item. Verifique se o patrimônio ou nº de série já existem.', 'danger');
            }
        });
    });

    $formEditarItem.on('submit', function(e) {
        e.preventDefault();
        const patrimonioOriginal = $('#edit-numeroPatrimonial-original').val();

        const dadosAtualizados = {
            descricao: $('#edit-descricao').val(),
            marca: $('#edit-marca').val(),
            numeroDeSerie: $('#edit-numeroDeSerie').val(),
            localizacao: $('#edit-localizacao').val(),
            compartimento: $('#edit-compartimento').val()
        };

        $.ajax({
            url: `/api/itens/${patrimonioOriginal}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dadosAtualizados),
            success: function() {
                showAlert('Item atualizado com sucesso!');
                modalEditarItem.hide();
                fetchAndDisplayItems();
            },
            error: function() {
                showAlert('Erro ao atualizar o item.', 'danger');
            }
        });
    });

    $('#form-transferencia').on('submit', function(e) {
        e.preventDefault();

        let destinoFinal = '';
        const selectedOption = $selectIncumbencia.find('option:selected');
        const codigoIncumbencia = selectedOption.val();

        if (!codigoIncumbencia) {
            showAlert('Por favor, selecione uma incumbência de destino.', 'warning');
            return;
        }

        const descricaoIncumbencia = selectedOption.data('descricao');

        if (codigoIncumbencia === 'OUTRA_OM' || codigoIncumbencia === 'DOACAO') {
            const textoExtra = $inputDestinoExtra.val().trim();
            if (!textoExtra) {
                const tipo = codigoIncumbencia === 'OUTRA_OM' ? 'a Outra OM' : 'o Destinatário da Doação';
                showAlert(`Por favor, especifique ${tipo}.`, 'warning');
                return;
            }
            destinoFinal = `${descricaoIncumbencia}: ${textoExtra}`;
        } else {
            destinoFinal = descricaoIncumbencia;
        }

        const observacao = $('#transfer-obs').val();

        if (selectedItems.size > 0) {
            const data = {
                numerosPatrimoniais: Array.from(selectedItems),
                incumbenciaDestino: destinoFinal,
                observacao: observacao
            };
            handleBulkTransfer(data);
        } else {
            // Ação única
            const data = {
                numeroPatrimonial: $('#transfer-patrimonio').val(),
                incumbenciaDestino: destinoFinal,
                observacao: observacao
            };
            handleSingleTransfer(data);
        }
    });

    $('#modalTransferencia').on('hidden.bs.modal', function () {
        // ... (código existente para limpar a seleção em massa) ...
        $destinoExtraWrapper.hide();
        $inputDestinoExtra.prop('required', false).val('');
        $selectIncumbencia.val('');
        $('#form-transferencia')[0].reset();
    });

    $formBuscaAvancada.on('submit', function(e) {
        e.preventDefault();
        const formDataArray = $(this).serializeArray();
        let searchParams = {};
        formDataArray.forEach(item => {
            if (item.value) { // Só adiciona ao objeto se o campo tiver valor
                searchParams[item.name] = item.value;
            }
        });
        fetchAndDisplayItems(searchParams);
    });

    $btnLimparBusca.on('click', function() {
        $formBuscaAvancada[0].reset(); // Limpa os campos do formulário
        fetchAndDisplayItems(); // Busca todos os itens novamente, sem filtros
    });

    const handleDelete = (patrimonio) => {
        $.ajax({
            url: `/api/itens/${patrimonio}`,
            method: 'DELETE',
            success: function() {
                showAlert('Item excluído com sucesso!');
                fetchAndDisplayItems();
            },
            error: function() { showAlert('Erro ao excluir item.', 'danger'); }
        });
    };

    const handleBulkDelete = () => {
        $.ajax({
            url: '/api/itens',
            method: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify(Array.from(selectedItems)),
            success: function() {
                showAlert(`${selectedItems.size} itens excluídos com sucesso!`);
                fetchAndDisplayItems();
            },
            error: function() { showAlert('Erro ao excluir itens.', 'danger'); }
        });
    };

    const handleBulkTransfer = (data) => {
        $.ajax({
            url: '/api/transferencias/massa',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert(`${data.numerosPatrimoniais.length} itens transferidos com sucesso!`);
                modalTransferencia.hide();
                fetchAndDisplayItems();
            },
            error: function() { showAlert('Erro ao transferir itens.', 'danger'); }
        });
    };

    const handleSingleTransfer = (data) => {
        $.ajax({
            url: '/api/transferencias',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Transferência registrada com sucesso!');
                modalTransferencia.hide();
                fetchAndDisplayItems();
            },
            error: function() { showAlert('Erro ao registrar transferência.', 'danger'); }
        });
    };

    const applyTheme = (theme) => {
        $('html').attr('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        $themeToggler.prop('checked', theme === 'dark');
    };

    $themeToggler.on('change', function() {
        applyTheme($(this).is(':checked') ? 'dark' : 'light');
    });

    // --- INICIALIZAÇÃO ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    fetchAndDisplayItems();
    popularCompartimentos('#novo-compartimento', 'Selecione um compartimento...');
    popularCompartimentos('#busca-compartimento', 'Todos os compartimentos');
    popularIncumbencias();
    setupUIForRole(userRole);
});
