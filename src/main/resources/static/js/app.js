$(function() {

    // --- LÓGICA DE CONTROLE DE ACESSO DA INTERFACE (UI) ---
    const setupUIForRole = (role) => {
        if (role === 'ADMIN') {
            $('#link-gestao-usuarios').show();
        } else {
            $('#link-gestao-usuarios').hide();
            $('#btn-novo-item').hide();
            $('#select-all-checkbox').closest('th').hide();
            bulkActionsCollapse.hide();
        }
    };

    // --- SELETORES ---
    const $tabelaInventarioBody = $('#tabela-inventario');
    const $cabecalhoTabelaInventario = $('#tabela-inventario').closest('table').find('thead');
    const $formNovoItem = $('#form-novo-item');
    const $formEditarItem = $('#form-editar-item');
    const $formTransferencia = $('#form-transferencia');
    const $formBuscaAvancada = $('#form-busca-avancada');
    const $btnConfirmarAcao = $('#btn-confirmar-acao');
    const $btnLimparBusca = $('#btn-limpar-busca');
    const $selectAllCheckbox = $('#select-all-checkbox');
    const bulkActionsCollapse = new bootstrap.Collapse($('#bulk-actions-collapse')[0], { toggle: false });
    const $selectionCounter = $('#selection-counter');
    const $btnExcluirSelecionados = $('#btn-excluir-selecionados');
    const $btnTransferirSelecionados = $('#btn-transferir-selecionados');
    const $selectIncumbencia = $('#transfer-destino-select');
    const $destinoExtraWrapper = $('#destino-extra-wrapper');
    const $inputDestinoExtra = $('#transfer-destino-extra-input');
    const $labelDestinoExtra = $('#label-destino-extra');
    const $btnLogout = $('#btn-logout');

    const modalNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));
    const modalEditarItem = new bootstrap.Modal(document.getElementById('modalEditarItem'));
    const modalTransferencia = new bootstrap.Modal(document.getElementById('modalTransferencia'));
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));

    // --- VARIÁVEIS DE ESTADO ---
    let allItemDTOs = [];
    let acaoConfirmada = null;
    let selectedItems = new Set();
    let currentSort = { column: 'id', direction: 'asc' };

    // --- FUNÇÕES DE LÓGICA ---

    // Ações em Massa
    const updateBulkActionUI = () => {
        const count = selectedItems.size;
        const $singleActionButtons = $('.btn-editar, .btn-transferir, .btn-excluir');
        if (count > 1 && userRole === 'ADMIN') {
            $('#selection-counter').text(`${count} item(s) selecionado(s)`);
            bulkActionsCollapse.show();
            $singleActionButtons.prop('disabled', true).addClass('opacity-50');
        } else {
            bulkActionsCollapse.hide();
            $singleActionButtons.prop('disabled', false).removeClass('opacity-50');
        }
        $selectAllCheckbox.prop('checked', count > 0 && count === $('.item-checkbox:not(:disabled)').length);
    };

    const fetchAndDisplayItems = (searchParams = {}) => {
        const queryString = $.param(searchParams);

        $.ajax({
            url: `/api/itens/ativos?${queryString}`,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                allItemDTOs = data;
                renderTable();
                selectedItems.clear();
                updateBulkActionUI();
            },
            error: function() {
                $tabelaInventarioBody.html('<tr><td colspan="9" class="text-center text-danger">Erro ao carregar inventário.</td></tr>');
            }
        });
    };

    const renderTable = () => {
        $tabelaInventarioBody.empty();

        const sortedItemDTOs = [...allItemDTOs].sort((a, b) => {
            const itemA = a.item;
            const itemB = b.item;

            let valA = itemA[currentSort.column];
            let valB = itemB[currentSort.column];

            if (currentSort.column === 'compartimento') {
                valA = itemA.compartimento ? itemA.compartimento.descricao : '';
                valB = itemB.compartimento ? itemB.compartimento.descricao : '';
            }

            valA = valA || '';
            valB = valB || '';

            return valA.toString().localeCompare(valB.toString()) * (currentSort.direction === 'asc' ? 1 : -1);
        });

        if (sortedItemDTOs.length === 0) {
            const colspan = userRole === 'ADMIN' ? 9 : 8;
            $tabelaInventarioBody.html(`<tr><td colspan="${colspan}" class="text-center text-muted">Nenhum item ativo encontrado.</td></tr>`);
            return;
        }

        sortedItemDTOs.forEach(dto => {
            const item = dto.item;
            const isDisponivel = item.status === 'DISPONIVEL';
            const compartimentoDesc = item.compartimento ? item.compartimento.descricao : 'N/A';

            let statusBadge = '';
            if (item.status === 'DISPONIVEL') {
                statusBadge = '<span class="badge rounded-pill text-bg-success">Disponível</span>';
            } else if (item.status === 'TRANSFERIDO') {
                if (dto.transferenciaPermanente) {
                    statusBadge = '<a href="/historico.html" title="Transferência permanente"><span class="badge rounded-pill text-bg-danger">Transferido</span></a>';
                } else {
                    statusBadge = '<a href="/historico.html" title="Consulte aqui"><span class="badge rounded-pill text-bg-warning">Transferido</span></a>';
                }
            }

            let acoesHtml = '';
            if (userRole === 'ADMIN') {
                if (isDisponivel) {
                    acoesHtml = `
                        <button class="btn btn-sm btn-primary btn-editar" title="Editar" data-patrimonio="${item.numeroPatrimonial}"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-sm btn-info btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-box-arrow-right"></i></button>
                        <button class="btn btn-sm btn-danger btn-excluir" title="Excluir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-trash3-fill"></i></button>
                    `;
                } else {
                    acoesHtml = `
                        <button class="btn btn-sm btn-primary btn-editar" style="opacity: 100%;" title="Editar" data-patrimonio="${item.numeroPatrimonial}"><i class="bi bi-pencil-fill"></i></button>
                    `;
                }
            } else {
                if (isDisponivel) {
                    acoesHtml = `<button class="btn btn-sm btn-info btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-box-arrow-right"></i></button>`;
                }
            }

            const checkboxHtml = userRole === 'ADMIN' ? `<td><input class="form-check-input item-checkbox" type="checkbox" value="${item.numeroPatrimonial}" ${!isDisponivel ? 'disabled' : ''}></td>` : '';

            const rowHtml = `
                <tr class="${!isDisponivel ? 'opacity-50' : ''}">
                    ${checkboxHtml}
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

        if (userRole !== 'ADMIN') {
            $('#select-all-checkbox').closest('th').hide();
            $('.item-checkbox').closest('td').hide();
        }
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
        $('.item-checkbox:not(:disabled)').prop('checked', isChecked);

        selectedItems.clear();
        if (isChecked) {
            $('.item-checkbox:not(:disabled)').each(function() {
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

    $formBuscaAvancada.on('submit', function(e) {
        e.preventDefault();
        const formDataArray = $(this).serializeArray();
        let searchParams = {};
        formDataArray.forEach(item => {
            if (item.value) {
                searchParams[item.name] = item.value;
            }
        });
        fetchAndDisplayItems(searchParams);
    });

    $btnLimparBusca.on('click', function() {
        $formBuscaAvancada[0].reset(); // Limpa os campos do formulário
        fetchAndDisplayItems(); // Busca todos os itens novamente, sem filtros
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

    $formTransferencia.on('submit', function(e) {
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

    // --- FUNÇÕES DE AJAX PARA AÇÕES ---
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

    // --- INICIALIZAÇÃO ---
    setupUIForRole(userRole);
    fetchAndDisplayItems();
    popularCompartimentos('#novo-compartimento', 'Selecione um compartimento...');
    popularCompartimentos('#busca-compartimento', 'Todos os compartimentos');
    popularIncumbencias();
});
