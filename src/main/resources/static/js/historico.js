$(function() {

    // --- SELETORES ---
    const $tabelaHistoricoBody = $('#tabela-historico');
    const $cabecalhoTabelaHistorico = $('#tabela-historico').closest('table').find('thead');
    const $formBusca = $('#form-busca-historico-avancada');
    const $btnLimparBusca = $('#btn-limpar-busca-historico');
    const $formDevolucao = $('#form-devolucao');
    const $btnLogout = $('#btn-logout');
    const $paginationControls = $('#pagination-controls-historico');
    const $paginationNav = $('#pagination-nav-historico');
    const $pageSizeSelect = $('#page-size-select-historico');
    const modalDevolucao = new bootstrap.Modal(document.getElementById('modalDevolucao'));
    const modalObservacoes = new bootstrap.Modal(document.getElementById('modalObservacoes'));

    // --- VARIÁVEIS DE ESTADO ---
    let currentSort = { column: 'dataTransferencia', direction: 'desc' };
    let currentPage = 0;

    // --- FUNÇÕES ---
    const formatarData = (dataISO) => {
        if (!dataISO) return 'N/A';
        return new Date(dataISO).toLocaleString('pt-BR');
    };

    const popularCompartimentosDevolucao = () => {
        $.ajax({
            url: '/api/util/compartimentos',
            method: 'GET',
            success: function(compartimentos) {
                const $select = $('#devolucao-compartimento');
                $select.empty().append('<option value="">Selecione um compartimento...</option>');
                compartimentos.forEach(c => {
                    $select.append(`<option value="${c.codigo}">${c.codigoDescricao}</option>`);
                });
            }
        });
    };

    const performSearch = (page = 0) => {
        const formDataArray = $formBusca.serializeArray();
        let searchParams = {};
        formDataArray.forEach(item => { if (item.value) { searchParams[item.name] = item.value; } });
        fetchHistory(searchParams, page, $pageSizeSelect.val());
    };

    const fetchHistory = (searchParams = {}, page = 0, size = 10) => {
        searchParams.page = page;
        searchParams.size = size;
        searchParams.sort = `${currentSort.column},${currentSort.direction}`;
        const queryString = $.param(searchParams);
        const $overlay = $('.table-loading-overlay');

        $.ajax({
            url: `/api/transferencias?${queryString}`,
            method: 'GET',
            dataType: 'json',
            beforeSend: function() {
                $overlay.removeClass('d-none');
            },
            success: (pageData) => {
                const detalhesTransferencia = pageData.content;
                renderHistoryTable(detalhesTransferencia);
                currentPage = pageData.currentPage;
                renderPaginationControls(pageData);
            },
            error: () => {
                $tabelaHistoricoBody.html('<tr><td colspan="7" class="text-center text-danger">Erro ao carregar o histórico.</td></tr>');
                $paginationControls.hide();
            },
            complete: function() {
                $overlay.addClass('d-none');
            }
        });
    };

    const renderPaginationControls = (pageData) => {
        const $paginationNav = $('#pagination-nav-historico');
        const $paginationControls = $('#pagination-controls-historico');
        const $pageInfo = $('#page-info-historico');
        const $pageSizeSelect = $('#page-size-select-historico');

        $paginationNav.empty();

        if (pageData.totalPages <= 1) {
            $paginationControls.hide();
            return;
        }

        $paginationControls.show();
        const totalItems = pageData.totalItems;
        const pageNumber = pageData.currentPage;

        const pageSize = parseInt(pageData.size || $pageSizeSelect.val(), 10);

        const startItem = totalItems > 0 ? (pageNumber * pageSize) + 1 : 0;
        const endItem = Math.min(startItem + pageSize - 1, totalItems);
        $pageInfo.text(`Exibindo ${startItem}-${endItem} de ${totalItems} registos`);

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
            const pagesToShowBeforeAndAfter = Math.floor((maxPagesToShow - 2) / 2);

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
                $paginationNav.append(createPageItem(currentPage - 3, '...', false, true));
            }

            for (let i = startPage; i <= endPage; i++) {
                if (i > 0 && i < totalPages - 1) {
                    $paginationNav.append(createPageItem(i, i + 1, i === currentPage));
                }
            }

            if (endPage < totalPages - 2) {
                $paginationNav.append(createPageItem(currentPage + 3, '...', false, true));
            }

            $paginationNav.append(createPageItem(totalPages - 1, totalPages, totalPages - 1 === currentPage));
        }

        $paginationNav.append(createPageItem(currentPage + 1, 'Próximo', false, pageData.last));
    };

    const renderHistoryTable = (detalhesTransferencia) => {
        $tabelaHistoricoBody.empty();

        if (!detalhesTransferencia || detalhesTransferencia.length === 0) {
            $tabelaHistoricoBody.html(
                '<tr><td colspan="7" class="text-center text-muted">Nenhum registo encontrado.</td></tr>'
            );
            return;
        }

        detalhesTransferencia.forEach(detalhe => {
            const transf = detalhe.transferencia;

            const botaoDevolverHtml = detalhe.podeSerDevolvido ?
                `<button class="btn btn-xs btn-success btn-devolver" title="Registar Devolução" data-patrimonio="${transf.numeroPatrimonialItem}" data-descricao="${transf.descricaoItem}"><i class="bi bi-box-arrow-in-left"></i></button>`
                : '';

            const incumbencia = transf.incumbenciaDestino || '';
            const isBaixaDefinitiva = ["000", "001", "002"].some(prefix => incumbencia.startsWith(prefix));
            const incumbenciaHtml = isBaixaDefinitiva ? `<span class="badge rounded-pill text-bg-danger">${incumbencia}</span>` : `<span class="badge rounded-pill text-bg-warning">${incumbencia}</span>`;

            const observacao = transf.observacao || '';
            const observacaoHtml = observacao ? `<button class="btn btn-xs btn-secondary btn-ver-obs" data-obs="${observacao}" title="Clique para visualizar observações"><i class="bi bi-eye-fill"></i></button>` : '';

            const rowHtml = `
                <tr>
                    <td>${formatarData(transf.dataTransferencia)}</td>
                    <td>${transf.numeroPatrimonialItem || 'N/A'}</td>
                    <td><span class="truncate-text" title="${transf.descricaoItem || 'N/A'}">${transf.descricaoItem || 'N/A'}</span></td>
                    <td>${incumbenciaHtml}</td>
                    <td>${observacaoHtml}</td>
                    <td>${transf.usuario ? transf.usuario.nome : 'Usuário desconhecido'}</td>
                    <td>${botaoDevolverHtml}</td>
                </tr>
                `;
            $tabelaHistoricoBody.append(rowHtml);
        });
    };

    // --- MANIPULADORES DE EVENTOS ---
    $btnLogout.on('click', function() {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    $('body').on('click', '.btn-ver-obs', function() {
        const observacaoTexto = $(this).data('obs');
        $('#modalObservacoesLabel').text('Observação da Transferência');
        $('#modalObservacoesBody').text(observacaoTexto);
        modalObservacoes.show();
    });

    $cabecalhoTabelaHistorico.on('click', 'th[data-sortable]', function() {
        const columnKey = $(this).data('column');
        if (!columnKey) return;
        const direction = (currentSort.column === columnKey && currentSort.direction === 'asc') ? 'desc' : 'asc';
        currentSort = { column: columnKey, direction: direction };
        $cabecalhoTabelaHistorico.find('i.sort-icon').remove();
        const iconClass = direction === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short';
        $(this).append(` <i class="bi ${iconClass} sort-icon text-warning"></i>`);
        performSearch(currentPage);
    });

    $formBusca.on('submit', (e) => {
        e.preventDefault();
        performSearch(0);
    });

    $btnLimparBusca.on('click', () => {
        $formBusca[0].reset();
        performSearch(0);
    });

    $paginationNav.on('click', 'a.page-link', function(e) {
        e.preventDefault();
        if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) { return; }
        const page = $(this).data('page');
        performSearch(page);
    });

    $pageSizeSelect.on('change', function() {
        performSearch(0);
    });

    $('body').on('click', '.btn-devolver', function() {
        const patrimonio = $(this).data('patrimonio');
        const descricao = $(this).data('descricao');
        $('#devolucao-patrimonio').val(patrimonio);
        $('#devolucao-item-descricao').text(`${descricao} (NumPAT: ${patrimonio})`);
        modalDevolucao.show();
    });

    $formDevolucao.on('submit', function(e) {
        e.preventDefault();

        const data = {
            numeroPatrimonial: $('#devolucao-patrimonio').val(),
            localizacao: $('#devolucao-localizacao').val(),
            compartimento: $('#devolucao-compartimento').val(),
            observacao: $('#devolucao-obs').val()
        };

        $.ajax({
            url: '/api/itens/devolver',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                modalDevolucao.hide();
                $formDevolucao[0].reset();
                showAlert('Devolução registrada com sucesso! O item está disponível no inventário.', 'success');
                performSearch(currentPage);
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || "Erro ao registar devolução.", 'danger');
            }
        });
    });

    // --- INICIALIZAÇÃO ---
    performSearch();
    popularCompartimentosDevolucao();
});
