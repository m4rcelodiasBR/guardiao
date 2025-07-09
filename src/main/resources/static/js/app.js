$(function() {

    // --- SELETORES ---
    const $tabelaInventarioBody = $('#tabela-inventario');
    const $cabecalhoTabelaInventario = $('#tabela-inventario').closest('table').find('thead');
    const $formNovoItem = $('#form-novo-item');
    const $formEditarItem = $('#form-editar-item');
    const $formEdicaoMassa = $('#form-edicao-massa');
    const $formTransferencia = $('#form-transferencia');
    const $formBuscaAvancada = $('#form-busca-avancada');
    const $btnConfirmarAcao = $('#btn-confirmar-acao');
    const $btnLimparBusca = $('#btn-limpar-busca');
    const $selectAllCheckbox = $('#select-all-checkbox');
    const bulkActionsCollapse = new bootstrap.Collapse($('#bulk-actions-collapse')[0], { toggle: false });
    const $filtrosStatus = $('#filtros-status');
    const $btnEditarSelecionados = $('#btn-editar-selecionados');
    const $btnExcluirSelecionados = $('#btn-excluir-selecionados');
    const $btnTransferirSelecionados = $('#btn-transferir-selecionados');
    const $selectIncumbencia = $('#transfer-destino-select');
    const $destinoExtraWrapper = $('#destino-extra-wrapper');
    const $inputDestinoExtra = $('#transfer-destino-extra-input');
    const $labelDestinoExtra = $('#label-destino-extra');
    const $btnLogout = $('#btn-logout');
    const $paginationNav = $('#pagination-nav');
    const $pageSizeSelect = $('#page-size-select');

    const modalEdicaoMassa = new bootstrap.Modal(document.getElementById('modalEdicaoMassa'));
    const modalNovoItem = new bootstrap.Modal(document.getElementById('modalNovoItem'));
    const modalEditarItem = new bootstrap.Modal(document.getElementById('modalEditarItem'));
    const modalTransferencia = new bootstrap.Modal(document.getElementById('modalTransferencia'));
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));

    // --- VARIÁVEIS DE ESTADO ---
    let allItemDTOs = [];
    let acaoConfirmada = null;
    let selectedItems = new Set();
    let currentSort = { column: 'id', direction: 'asc' };
    let currentPage = 0;

    // --- FUNÇÕES DE LÓGICA ---
    const highlightResults = (tableSelector, searchTerm) => {
        const tableBody = $(tableSelector);

        tableBody.find('mark').each(function() {
            $(this).replaceWith($(this).html());
        });

        if (!searchTerm || !searchTerm.trim()) {
            return;
        }

        const searchRegEx = new RegExp(searchTerm.trim(), "gi");

        const walk = (node) => {
            if (node.nodeType === 3) {
                const text = node.nodeValue;
                const match = searchRegEx.exec(text);
                if (match) {
                    const newNode = document.createElement('span');
                    newNode.innerHTML = text.replace(searchRegEx, (match) => `<mark>${match}</mark>`);
                    node.parentNode.replaceChild(newNode, node);
                }
            } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) { // Nó do tipo Elemento
                for (let i = 0; i < node.childNodes.length; i++) {
                    walk(node.childNodes[i]);
                }
            }
        };

        tableBody.find('td').each(function() {
            walk(this);
        });
    };

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

    const performSearch = (page = 0) => {
        const formDataArray = $formBuscaAvancada.serializeArray();
        let searchParams = {};
        formDataArray.forEach(item => { if (item.value) { searchParams[item.name] = item.value; } });
        const status = $filtrosStatus.find('input:checked').val();
        if (status) { searchParams.status = status; }
        searchParams.page = page;
        searchParams.size = $pageSizeSelect.val();
        searchParams.sort = `${currentSort.column},${currentSort.direction}`;
        fetchAndDisplayItems(searchParams);
    };

    const fetchAndDisplayItems = (searchParams = {}) => {
        const queryString = $.param(searchParams);
        const $overlay = $('.table-loading-overlay');
        $.ajax({
            url: `/api/itens/filtrar?${queryString}`,
            method: 'GET',
            dataType: 'json',
            beforeSend: function() {
                $overlay.removeClass('d-none');
            },
            success: function(pageData) {
                allItemDTOs = pageData.content;
                renderTable();
                currentPage = pageData.currentPage;
                renderPaginationControls(pageData);
                selectedItems.clear();
                updateBulkActionUI();
                const termoBuscaDescricao = $('#busca-descricao').val();
                highlightResults('#tabela-inventario', termoBuscaDescricao);
            },
            error: function() {
                $tabelaInventarioBody.html('<tr><td colspan="9" class="text-center text-danger">Erro ao carregar inventário.</td></tr>');
                $('#pagination-controls').hide();
            },
            complete: function() {
                $overlay.addClass('d-none');
            }
        });
    };

    const renderPaginationControls = (pageData) => {
        const $paginationNav = $('#pagination-nav');
        $paginationNav.empty();

        if (pageData.totalPages <= 1) {
            $('#pagination-controls').hide();
            return;
        }

        $('#pagination-controls').show();
        const totalItems = pageData.totalItems;
        const pageNumber = pageData.currentPage;
        const pageSize = parseInt(pageData.size || $pageSizeSelect.val(), 10);
        const startItem = totalItems > 0 ? (pageNumber * pageSize) + 1 : 0;
        const endItem = Math.min(startItem + pageSize - 1, totalItems);
        $('#page-info').text(`Exibindo ${startItem}-${endItem} de ${totalItems} itens`);

        const totalPages = pageData.totalPages;
        const currentPage = pageData.currentPage;
        const maxPagesToShow = 7;

        const createPageItem = (page, text, isActive = false, isDisabled = false) => {
            return `
            <li class="page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${page}">${text}</a>
            </li>
        `;
        };

        $paginationNav.append(createPageItem(currentPage - 1, 'Anterior', false, pageData.first));

        if (totalPages <= maxPagesToShow) {
            for (let i = 0; i < totalPages; i++) {
                $paginationNav.append(createPageItem(i, i + 1, i === currentPage));
            }
        } else {
            let startPage, endPage;
            const pagesToShowBeforeAndAfter = Math.floor((maxPagesToShow - 2) / 2); // Quantas páginas mostrar antes e depois da atual

            if (currentPage <= pagesToShowBeforeAndAfter) {
                startPage = 0;
                endPage = maxPagesToShow - 2;
            } else if (currentPage + pagesToShowBeforeAndAfter >= totalPages - 1) {
                startPage = totalPages - (maxPagesToShow - 1);
                endPage = totalPages - 1;
            } else {
                startPage = currentPage - pagesToShowBeforeAndAfter;
                endPage = currentPage + pagesToShowBeforeAndAfter;
            }

            $paginationNav.append(createPageItem(0, '1', 0 === currentPage));

            if (startPage > 1) {
                $paginationNav.append(createPageItem(currentPage - 3, '...', false, true)); // O data-page aqui pode ser ajustado
            }

            for (let i = startPage; i <= endPage; i++) {
                if (i > 0 && i < totalPages - 1) {
                    $paginationNav.append(createPageItem(i, i + 1, i === currentPage));
                }
            }

            if (endPage < totalPages - 2) {
                $paginationNav.append(createPageItem(currentPage + 3, '...', false, true)); // O data-page aqui pode ser ajustado
            }

            $paginationNav.append(createPageItem(totalPages - 1, totalPages, totalPages - 1 === currentPage));
        }

        $paginationNav.append(createPageItem(currentPage + 1, 'Próximo', false, pageData.last));
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
            const compartimentoCodigo = item.compartimento.codigo;
            const compartimentoDescricao = item.compartimento.descricao;

            let statusBadge = '';
            if (item.status === 'DISPONIVEL') {
                statusBadge = '<span class="badge rounded-pill text-bg-success">Disponível</span>';
            } else if (item.status === 'TRANSFERIDO') {
                if (dto.transferenciaPermanente) {
                    statusBadge = '<a href="/historico.html" title="Transferência permanente"><span class="badge rounded-pill text-bg-danger">Transferido</span></a>';
                } else {
                    statusBadge = '<a href="/historico.html" title="Transfeiro. Clique para consultar"><span class="badge rounded-pill text-bg-warning">Transferido</span></a>';
                }
            }

            let acoesHtml = '';
            if (userRole === 'ADMIN') {
                if (isDisponivel) {
                    acoesHtml = `
                        <button class="btn btn-xs btn-primary btn-editar" title="Editar" data-patrimonio="${item.numeroPatrimonial}"><i class="bi bi-pencil-fill"></i></button>
                        <button class="btn btn-xs btn-warning btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-box-arrow-right"></i></button>
                        <button class="btn btn-xs btn-danger btn-excluir" title="Excluir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-trash3-fill"></i></button>
                    `;
                }
            } else {
                if (isDisponivel) {
                    acoesHtml = `<button class="btn btn-xs btn-warning btn-transferir" title="Transferir" data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}"><i class="bi bi-box-arrow-right"></i></button>`;
                }
            }

            const checkboxHtml = userRole === 'ADMIN' ? `<td><input id="check-box-${item.numeroPatrimonial}" class="form-check-input item-checkbox" type="checkbox" value="${item.numeroPatrimonial}" ${!isDisponivel ? 'disabled' : ''}></td>` : '';

            const rowHtml = `
                <tr class="${!isDisponivel ? 'opacity-50' : ''}">
                    ${checkboxHtml}
                    <td>${statusBadge}</td>
                    <td>${item.numeroPatrimonial || 'N/A'}</td>
                    <td><span class="truncate-text" title="${item.descricao}">${item.descricao}</span></td>
                    <td>${item.marca || 'N/A'}</td>
                    <td>${item.numeroDeSerie || 'N/A'}</td>
                    <td>${item.localizacao || 'N/A'}</td>
                    <td title="${compartimentoDescricao}">${compartimentoCodigo}</td>
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

    // --- MANIPULADORES DE EVENTOS ---
    $paginationNav.on('click', 'a.page-link', function(e) {
        e.preventDefault();
        if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) {
            return;
        }
        const page = $(this).data('page');
        performSearch(page);
    });

    $pageSizeSelect.on('change', function() {
        performSearch(0);
    });

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
        const iconClass = direction === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
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
                const compartimentoAtual = item.compartimento ? item.compartimento.codigo : null;
                popularCompartimentos('#edit-compartimento', 'Selecione...', compartimentoAtual);
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
        $('#item-a-transferir-descricao').text(`${selectedItems.size} itens selecionados`);
        $('#transfer-patrimonio').val('');
        modalTransferencia.show();
    });

    $filtrosStatus.on('change', 'input[name="status-filter"]', () => performSearch(0));

    $formBuscaAvancada.on('submit', (e) => {
        e.preventDefault();
        performSearch(0);
    });

    $btnLimparBusca.on('click', function() {
        $formBuscaAvancada[0].reset();
        $('#filter-todos').prop('checked', true);
        performSearch();
    });

    // --- SUBMISSÃO DOS FORMULÁRIOS ---
    $formNovoItem.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
        const formDataArray = $form.serializeArray();
        let data = {};
        formDataArray.forEach(item => {
            if (item.value) { data[item.name] = item.value; }
        });
        $.ajax({
            url: '/api/itens',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert('Item cadastrado com sucesso!');
                $formNovoItem[0].reset();
                modalNovoItem.hide();
                performSearch();
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON?.message || 'Erro ao cadastrar item. Verifique se o patrimônio ou nº de série já existem.';
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
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert('Item atualizado com sucesso!');
                modalEditarItem.hide();
                performSearch(currentPage);
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
        const $submitButton = $form.closest('.modal-content').find('button[type="submit"][form="form-edicao-massa"]');
        const localizacao = $('#massa-localizacao').val();
        const compartimento = $('#massa-compartimento').val();

        if (!localizacao && !compartimento) {
            showAlert('Preencha pelo menos um campo (Localização ou Compartimento) para atualizar.', 'warning');
            return;
        }

        const data = {
            numerosPatrimoniais: Array.from(selectedItems)
        };

        if (localizacao) {
            data.localizacao = localizacao;
        }

        if (compartimento) {
            data.compartimento = compartimento;
        }

        $.ajax({
            url: '/api/itens/massa',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert(`${selectedItems.size} itens atualizados com sucesso!`);
                modalEdicaoMassa.hide();
                performSearch(currentPage);
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || 'Erro ao atualizar itens selecionados.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar itens selecionados');
            }
        });
    });

    $formTransferencia.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');

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

        $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmando...');

        if (selectedItems.size > 0) {
            const data = {
                numerosPatrimoniais: Array.from(selectedItems),
                incumbenciaDestino: destinoFinal,
                observacao: observacao
            };
            handleBulkTransfer(data, $submitButton);
        } else {
            const data = {
                numeroPatrimonial: $('#transfer-patrimonio').val(),
                incumbenciaDestino: destinoFinal,
                observacao: observacao
            };
            handleSingleTransfer(data, $submitButton);
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
            error: function() {
                showAlert('Erro ao transferir itens.', 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Confirmar Transferência');
            }
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
    performSearch();
});
