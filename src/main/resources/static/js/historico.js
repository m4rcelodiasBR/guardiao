$(function() {

    // --- LÓGICA DE CONTROLE DE ACESSO DA INTERFACE (UI) ---
    const setupUIForRole = (role) => {
        if (role !== 'ADMIN') {
            $('#link-gestao-usuarios').hide();
            $('#select-all-checkbox').prop('disabled', true);
            $('.btn-devolver').hide();
        } else {
            $('#link-gestao-usuarios').show();
        }
    };

    // --- SELETORES ---
    const $tabelaHistoricoBody = $('#tabela-historico');
    const $cabecalhoTabelaHistorico = $('#tabela-historico').closest('table').find('thead');
    const $formBusca = $('#form-busca-historico-avancada');
    const $btnLimparBusca = $('#btn-limpar-busca-historico');
    const $themeToggler = $('#theme-toggler');
    const $formDevolucao = $('#form-devolucao');
    const $btnLogout = $('#btn-logout');
    const $paginationControls = $('#pagination-controls-historico');
    const $paginationNav = $('#pagination-nav-historico');
    const $pageInfo = $('#page-info-historico');
    const $pageSizeSelect = $('#page-size-select-historico');
    const modalDevolucao = new bootstrap.Modal(document.getElementById('modalDevolucao'));
    const modalObservacoes = new bootstrap.Modal(document.getElementById('modalObservacoes'));

    // --- VARIÁVEIS DE ESTADO ---
    let currentSort = { column: 'dataTransferencia', direction: 'desc' };
    let currentPage = 0;

    // --- FUNÇÕES ---
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

        $.ajax({
            url: `/api/transferencias?${queryString}`,
            method: 'GET',
            dataType: 'json',
            success: (pageData) => {
                const detalhesTransferencia = pageData.content;
                renderHistoryTable(detalhesTransferencia);
                currentPage = pageData.currentPage;
                renderPaginationControls(pageData);
            },
            error: () => {
                $tabelaHistoricoBody.html('<tr><td colspan="7" class="text-center text-danger">Erro ao carregar o histórico.</td></tr>');
                $paginationControls.hide();
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

        const totalItems = pageData.totalItems;
        const pageNumber = pageData.currentPage;
        const pageSize = $pageSizeSelect.val();
        const startItem = totalItems > 0 ? (pageNumber * pageSize) + 1 : 0;
        const endItem = Math.min(startItem + pageSize - 1, totalItems);

        $pageInfo.text(`Exibindo ${startItem}-${endItem} de ${totalItems} registos`);

        $paginationNav.append(`<li class="page-item ${pageData.first ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${pageNumber - 1}">Anterior</a></li>`);
        for (let i = 0; i < pageData.totalPages; i++) {
            $paginationNav.append(`<li class="page-item ${i === pageNumber ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i + 1}</a></li>`);
        }
        $paginationNav.append(`<li class="page-item ${pageData.last ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${pageNumber + 1}">Próximo</a></li>`);
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

            const botaoDevolverHtml = detalhe.podeSerDevolvido && userRole === 'ADMIN' ?
                `<button class="btn btn-sm btn-success btn-devolver" title="Registar Devolução" data-patrimonio="${transf.numeroPatrimonialItem}" data-descricao="${transf.descricaoItem}"><i class="bi bi-box-arrow-in-left"></i></button>`
                : '';

            const incumbencia = transf.incumbenciaDestino || '';
            const isBaixaDefinitiva = ["000", "001", "002"].some(prefix => incumbencia.startsWith(prefix));
            const incumbenciaHtml = isBaixaDefinitiva ? `<span class="badge rounded-pill text-bg-danger">${incumbencia}</span>` : `<span class="badge rounded-pill text-bg-warning">${incumbencia}</span>`;

            const observacao = transf.observacao || '';
            const observacaoHtml = observacao ? `<button class="btn btn-sm btn-secondary btn-ver-obs" data-obs="${observacao}" title="Clique para visualizar observações"><i class="bi bi-eye-fill"></i></button>` : '';

            const rowHtml = `
                <tr>
                    <td>${formatarData(transf.dataTransferencia)}</td>
                    <td>${transf.numeroPatrimonialItem || 'N/A'}</td>
                    <td>${transf.descricaoItem || 'N/A'}</td>
                    <td>${incumbenciaHtml}</td>
                    <td>${observacaoHtml}</td>
                    <td>${transf.usuario ? transf.usuario.nome : 'Utilizador desconhecido'}</td>
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
    setupUIForRole(userRole);
});
