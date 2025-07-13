$(document).on('global-setup-complete', function() {

    const $formBuscaAvancada = $('#form-busca-avancada');
    const $btnLimparBusca = $('#btn-limpar-busca');
    const $filtrosStatus = $('#filtros-status');
    const $selectAllCheckbox = $('#select-all-checkbox');
    const $selectionCounter = $('#selection-counter');
    const $selectIncumbencia = $('#transfer-destino-select');
    const $destinoExtraWrapper = $('#destino-extra-wrapper');
    const $inputDestinoExtra = $('#transfer-destino-extra-input');
    const $labelDestinoExtra = $('#label-destino-extra');
    const bulkActionsCollapse = new bootstrap.Collapse($('#bulk-actions-collapse')[0], { toggle: false });

    // Seletores de formulários e botões de ação em massa
    const $formNovoItem = $('#form-novo-item');
    const $formEditarItem = $('#form-editar-item');
    const $formEdicaoMassa = $('#form-edicao-massa');
    const $formTransferencia = $('#form-transferencia');
    const $btnConfirmarAcao = $('#btn-confirmar-acao');
    const $btnEditarSelecionados = $('#btn-editar-selecionados');
    const $btnExcluirSelecionados = $('#btn-excluir-selecionados');
    const $btnTransferirSelecionados = $('#btn-transferir-selecionados');

    // Instâncias dos Modais Bootstrap
    const modalNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));
    const modalEditarItem = new bootstrap.Modal(document.getElementById('modalEditarItem'));
    const modalEdicaoMassa = new bootstrap.Modal(document.getElementById('modalEdicaoMassa'));
    const modalTransferencia = new bootstrap.Modal(document.getElementById('modalTransferencia'));
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));

    // Variáveis de estado
    let acaoConfirmada = null;
    let selectedItems = new Set();

    // --- FUNÇÕES DE LÓGICA ---
    const popularCompartimentos = (selectId, placeholder, selectedValue = null) => {
        const $select = $(selectId);
        $.ajax({
            url: '/api/util/compartimentos',
            method: 'GET',
            success: function(compartimentos) {
                $select.empty().append(`<option value="">${placeholder}</option>`);
                compartimentos.forEach(c => {
                    const isSelected = c.codigo === selectedValue ? 'selected' : '';
                    $select.append(`<option value="${c.codigo}" ${isSelected}>${c.codigoDescricao}</option>`);
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

    const updateBulkActionUI = () => {
        const count = selectedItems.size;
        if (count > 1 && userRole === 'ADMIN') {
            $selectionCounter.text(`${count} item(s) selecionado(s)`);
            bulkActionsCollapse.show();
        } else {
            bulkActionsCollapse.hide();
        }
        const totalCheckboxesNaPagina = $('.item-checkbox:not(:disabled)').length;
        const totalSelecionadosNaPagina = $('.item-checkbox:checked:not(:disabled)').length;
        $selectAllCheckbox.prop('checked', totalCheckboxesNaPagina > 0 && totalSelecionadosNaPagina === totalCheckboxesNaPagina);
    };

    const dataTable = $('#datatable-inventario').DataTable({
        serverSide: true,
        responsive: true,
        processing: true,
        ajax: function (data, callback, settings) {
            const formDataArray = $formBuscaAvancada.serializeArray();
            let buscaAvancada = {};
            formDataArray.forEach(item => { if (item.value) { buscaAvancada[item.name] = item.value; } });
            const status = $filtrosStatus.find('input:checked').val();
            if (status) { buscaAvancada.status = status; }

            const dtParams = {
                draw: data.draw,
                start: data.start,
                length: data.length,
                'search[value]': data.search.value
            };

            if (data.order && data.order.length > 0) {
                dtParams['order[0][column]'] = data.order[0].column;
                dtParams['order[0][dir]'] = data.order[0].dir;
            }

            const url = '/api/itens/datatable?' + $.param(dtParams);

            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(buscaAvancada),
                success: function(json) {
                    selectedItems.clear();
                    updateBulkActionUI();
                    callback(json);
                },
                error: function() {
                    showAlert('Erro ao carregar dados do inventário.', 'danger');
                    callback({
                        draw: data.draw,
                        recordsTotal: 0,
                        recordsFiltered: 0,
                        data: []
                    });
                }
            });
        },
        columns: [
            {
                data: null, orderable: false, searchable: false, className: 'dt-body-center',
                render: function (data, type, row) {
                    const isDisponivel = row.item.status === 'DISPONIVEL';
                    const disabledAttr = !isDisponivel || userRole !== 'ADMIN' ? 'disabled' : '';
                    return `<input class="form-check-input item-checkbox" type="checkbox" value="${row.item.numeroPatrimonial}" ${disabledAttr}>`;
                }
            },
            {
                data: 'item.status',
                render: function(data, type, row) {
                    if (data === 'DISPONIVEL') return '<span class="badge rounded-pill text-bg-success" title="Disponível" style="cursor: pointer;">D</span>';
                    if (data === 'TRANSFERIDO') {
                        const link = `<a href="/historico.html?patrimonio=${row.item.numeroPatrimonial}" target="_blank" title="Transferido. Clique para ver o histórico">`;
                        const badge = row.transferenciaPermanente
                            ? '<span class="badge rounded-pill text-bg-danger">T</span>'
                            : '<span class="badge rounded-pill text-bg-warning">T</span>';
                        return `${link}${badge}</a>`;
                    }
                    return data;
                }
            },
            { data: 'item.numeroPatrimonial', defaultContent: '' },
            { data: 'item.descricao', render: $.fn.dataTable.render.ellipsis(80, true) },
            { data: 'item.marca', defaultContent: '' },
            { data: 'item.numeroDeSerie', defaultContent: '' },
            { data: 'item.localizacao', defaultContent: '' },
            {
                data: 'item.compartimento.codigo', defaultContent: '',
                render: function(data, type, row) {
                    const compartimento = row.item.compartimento;
                    if (compartimento && compartimento.descricao) {
                        return `<span title="${compartimento.descricao}" style="cursor: pointer;">${data}</span>`;
                    }
                    return data;
                }
            },
            {
                data: null, orderable: false, searchable: false,
                render: function(data, type, row) {
                    let acoesHtml = '';
                    const isDisponivel = row.item.status === 'DISPONIVEL';
                    if (userRole === 'ADMIN' && isDisponivel) {
                        acoesHtml = `
                            <button class="btn btn-xs btn-primary btn-editar" title="Editar"><i class="bi bi-pencil-fill"></i></button>
                            <button class="btn btn-xs btn-warning btn-transferir" title="Transferir"><i class="bi bi-box-arrow-right"></i></button>
                            <button class="btn btn-xs btn-danger btn-excluir" title="Excluir"><i class="bi bi-trash3-fill"></i></button>
                        `;
                    } else if (isDisponivel) {
                        acoesHtml = `<button class="btn btn-xs btn-warning btn-transferir" title="Transferir"><i class="bi bi-box-arrow-right"></i></button>`;
                    }
                    return acoesHtml;
                }
            }
        ],
        language: { url: '/js/datatables-traducoes/pt-BR.json' },
        order: [[2, 'asc']],
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

    // --- MANIPULADORES DE EVENTOS ---
    $formBuscaAvancada.on('submit', (e) => {
        e.preventDefault(); dataTable.ajax.reload();
    });

    $btnLimparBusca.on('click', () => {
        $formBuscaAvancada[0].reset();
        $('#filter-todos').prop('checked', true);
        dataTable.ajax.reload();
    });

    $filtrosStatus.on('change', 'input[name="status-filter"]', () => dataTable.ajax.reload());

    $('#datatable-inventario tbody').on('click', 'button', function() {
        const rowData = dataTable.row($(this).parents('tr')).data();
        if (!rowData) return;

        if ($(this).hasClass('btn-editar')) {
            $('#edit-numeroPatrimonial-original').val(rowData.item.numeroPatrimonial);
            $('#edit-numeroPatrimonial').val(rowData.item.numeroPatrimonial);
            $('#edit-descricao').val(rowData.item.descricao);
            $('#edit-marca').val(rowData.item.marca);
            $('#edit-numeroDeSerie').val(rowData.item.numeroDeSerie);
            $('#edit-localizacao').val(rowData.item.localizacao);
            const compartimentoAtual = rowData.item.compartimento ? rowData.item.compartimento.codigo : null;
            popularCompartimentos('#edit-compartimento', 'Selecione...', compartimentoAtual);
            modalEditarItem.show();
        } else if ($(this).hasClass('btn-excluir')) {
            $('#confirm-title').text('Confirmar Exclusão');
            $('#confirm-body').text(`Tem certeza que deseja excluir o item: ${rowData.item.descricao}?`);
            acaoConfirmada = () => handleDelete(rowData.item.numeroPatrimonial);
            modalConfirmacao.show();
        } else if ($(this).hasClass('btn-transferir')) {
            $('#item-a-transferir-descricao').text(rowData.item.descricao);
            $('#transfer-patrimonio').val(rowData.item.numeroPatrimonial);
            modalTransferencia.show();
        }
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

    $selectAllCheckbox.on('change', function() {
        const isChecked = $(this).is(':checked');
        $('.item-checkbox:not(:disabled)').prop('checked', isChecked).trigger('change');
    });

    $('#datatable-inventario tbody').on('change', '.item-checkbox', function() {
        const patrimonio = $(this).val();
        if ($(this).is(':checked')) {
            selectedItems.add(patrimonio);
        } else {
            selectedItems.delete(patrimonio);
        }
        updateBulkActionUI();
    });

    $btnEditarSelecionados.on('click', function() {
        if (selectedItems.size === 0) return;
        $('#edicao-massa-counter').text(selectedItems.size);
        $formEdicaoMassa[0].reset();
        modalEdicaoMassa.show();
    });

    $btnExcluirSelecionados.on('click', function() {
        $('#confirm-title').text('Confirmar Exclusão em Massa');
        $('#confirm-body').text(`Tem certeza que deseja excluir os ${selectedItems.size} itens selecionados? Esta ação não pode ser desfeita.`);
        acaoConfirmada = () => handleBulkDelete();
        modalConfirmacao.show();
    });

    $btnTransferirSelecionados.on('click', function() {
        if (selectedItems.size === 0) return;
        $formTransferencia[0].reset();
        $destinoExtraWrapper.hide();
        $inputDestinoExtra.prop('required', false).val('');
        $('#item-a-transferir-descricao').text(`${selectedItems.size} itens selecionados`);
        modalTransferencia.show();
    });

    $btnConfirmarAcao.on('click', function() {
        if (typeof acaoConfirmada === 'function') acaoConfirmada();
    });

    // --- SUBMISSÃO DOS FORMULÁRIOS ---
    $formNovoItem.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
        const formDataArray = $form.serializeArray();
        let data = {};
        formDataArray.forEach(item => { if (item.value) { data[item.name] = item.value; } });

        $.ajax({
            url: '/api/itens',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Salvando...');
            },
            success: function() {
                showAlert('Item cadastrado com sucesso!');
                modalNovoItem.hide();
                dataTable.ajax.reload();
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Erro ao cadastrar item.';
                showAlert(errorMessage, 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Item');
            }
        });
    });

    $formEditarItem.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
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
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Salvando...');
            },
            success: function() {
                showAlert('Item atualizado com sucesso!');
                modalEditarItem.hide();
                dataTable.ajax.reload(null, false);
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Erro ao atualizar o item.';
                showAlert(errorMessage, 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Alterações');
            }
        });
    });

    $formEdicaoMassa.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.closest('.modal-content').find('button[type="submit"]');
        const localizacao = $('#massa-localizacao').val();
        const compartimento = $('#massa-compartimento').val();

        if (!localizacao && !compartimento) {
            showAlert('Preencha pelo menos um campo para atualizar.', 'warning');
            return;
        }

        const data = { numerosPatrimoniais: Array.from(selectedItems) };
        if (localizacao) { data.localizacao = localizacao; }
        if (compartimento) { data.compartimento = compartimento; }

        $.ajax({
            url: '/api/itens/massa',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Salvando...');
            },
            success: function() {
                showAlert(`${selectedItems.size} itens atualizados com sucesso!`);
                modalEdicaoMassa.hide();
                dataTable.ajax.reload(null, false);
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || 'Erro ao atualizar itens.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Alterações em Massa');
            }
        });
    });

    $formTransferencia.on('submit', function(e) {
        e.preventDefault();
        const $submitButton = $(this).find('button[type="submit"]');
        const singlePatrimonio = $('#transfer-patrimonio').val();

        let destinoFinal = '';
        const selectedOption = $selectIncumbencia.find('option:selected');
        const codigoIncumbencia = selectedOption.val();
        if (!codigoIncumbencia) { showAlert('Por favor, selecione uma incumbência de destino.', 'warning'); return; }
        const descricaoIncumbencia = selectedOption.data('descricao');
        if (codigoIncumbencia === 'OUTRA_OM' || codigoIncumbencia === 'DOACAO') {
            const textoExtra = $inputDestinoExtra.val().trim();
            if (!textoExtra) { showAlert(`Por favor, especifique o detalhe do destino.`, 'warning'); return; }
            destinoFinal = `${descricaoIncumbencia}: ${textoExtra}`;
        } else {
            destinoFinal = descricaoIncumbencia;
        }
        const observacao = $('#transfer-obs').val();

        $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Confirmando...');

        if (singlePatrimonio) {
            const data = { numeroPatrimonial: singlePatrimonio, incumbenciaDestino: destinoFinal, observacao: observacao };
            handleSingleTransfer(data, $submitButton);
        } else if (selectedItems.size > 0) {
            const data = { numerosPatrimoniais: Array.from(selectedItems), incumbenciaDestino: destinoFinal, observacao: observacao };
            handleBulkTransfer(data, $submitButton);
        } else {
            showAlert('Nenhum item válido para transferência.', 'warning');
            $submitButton.prop('disabled', false).text('Confirmar Transferência');
        }
    });

    $('#modalTransferencia').on('hidden.bs.modal', function () {
        $destinoExtraWrapper.hide();
        $inputDestinoExtra.prop('required', false).val('');
        $selectIncumbencia.val('');
        $('#form-transferencia')[0].reset();
    });

    // --- FUNÇÕES DE AJAX PARA AÇÕES ---
    const handleDelete = (patrimonio) => {
        $.ajax({
            url: `/api/itens/${patrimonio}`,
            method: 'DELETE',
            success: function() {
                showAlert('Item excluído com sucesso!');
                modalConfirmacao.hide();
                dataTable.ajax.reload();
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
                modalConfirmacao.hide();
                dataTable.ajax.reload();
            },
            error: function() { showAlert('Erro ao excluir itens.', 'danger'); }
        });
    };

    const handleBulkTransfer = (data, $submitButton) => {
        $.ajax({
            url: '/api/transferencias/massa',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert(`${data.numerosPatrimoniais.length} itens transferidos com sucesso!`);
                modalTransferencia.hide();
                dataTable.ajax.reload();
            },
            error: function() {
                showAlert('Erro ao transferir itens.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Confirmar Transferência');
            }
        });
    };

    const handleSingleTransfer = (data, $submitButton) => {
        $.ajax({
            url: '/api/transferencias',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Transferência registrada com sucesso!');
                modalTransferencia.hide();
                dataTable.ajax.reload();
            },
            error: function() {
                showAlert('Erro ao registrar transferência.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Confirmar Transferência');
            }
        });
    };

    // --- INICIALIZAÇÃO ---
    popularCompartimentos('#novo-compartimento', 'Selecione um compartimento...');
    popularCompartimentos('#busca-compartimento', 'Todos os compartimentos');
    popularCompartimentos('#massa-compartimento', 'Manter o compartimento atual');
    popularIncumbencias();
});
