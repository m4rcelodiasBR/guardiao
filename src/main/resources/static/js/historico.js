$(function() {

    // --- SELETORES ---
    const $tabelaHistoricoBody = $('#tabela-historico');
    const $cabecalhoTabelaHistorico = $('#tabela-historico').closest('table').find('thead');
    const $formBusca = $('#form-busca-historico-avancada');
    const $btnLimparBusca = $('#btn-limpar-busca-historico');
    const $themeToggler = $('#theme-toggler');
    const $formDevolucao = $('#form-devolucao');
    const modalDevolucao = new bootstrap.Modal(document.getElementById('modalDevolucao'));
    const $btnLogout = $('#btn-logout');

    // --- VARIÁVEIS DE ESTADO ---
    let allTransfers = [];
    let currentSort = { column: 'dataTransferencia', direction: 'desc' };

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
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR');
    };

    const renderHistoryTable = () => {
        $tabelaHistoricoBody.empty();

        const itemState = {};
        [...allTransfers].sort((a, b) => a.id - b.id).forEach(t => {
            const incumbencia = t.incumbenciaDestino || '';
            const isDevolucao = incumbencia === "Devolvido ao inventário";
            const isBaixaDefinitiva = ["000", "001", "002"].some(prefix => incumbencia.startsWith(prefix));

            let statusFinal = 'TRANSFERIDO';
            if (isDevolucao) {
                statusFinal = 'DISPONIVEL';
            } else if (isBaixaDefinitiva) {
                statusFinal = 'PERMANENTE';
            }
            itemState[t.numeroPatrimonialItem] = {
                status: statusFinal,
                lastTransferId: t.id
            };
        });

        const sortedTransfers = [...allTransfers].sort((a, b) => {
            let valA = a[currentSort.column], valB = b[currentSort.column];
            if (currentSort.column === 'usuario') {
                valA = a.usuario ? a.usuario.nome : '';
                valB = b.usuario ? b.usuario.nome : '';
            }
            valA = valA || ''; valB = valB || '';
            return valA.toString().localeCompare(valB.toString()) * (currentSort.direction === 'asc' ? 1 : -1);
        });

        if (sortedTransfers.length === 0) {
            $tabelaHistoricoBody.html('<tr><td colspan="7" class="text-center text-muted">Nenhum registro encontrado.</td></tr>');
            return;
        }

        sortedTransfers.forEach(transf => {
            const estadoAtualDoItem = itemState[transf.numeroPatrimonialItem];
            const podeDevolver = estadoAtualDoItem && estadoAtualDoItem.status === 'TRANSFERIDO' && estadoAtualDoItem.lastTransferId === transf.id;
            const botaoDevolverHtml = podeDevolver ? `<button class="btn btn-sm btn-success btn-devolver" title="Registrar Devolução" data-patrimonio="${transf.numeroPatrimonialItem}" data-descricao="${transf.descricaoItem}"><i class="bi bi-box-arrow-in-left"></i></button>` : '';
            const incumbencia = transf.incumbenciaDestino || '';
            const isBaixaDefinitiva = ["000", "001", "002"].some(prefix => incumbencia.startsWith(prefix));
            const incumbenciaHtml = isBaixaDefinitiva ? `<span class="badge rounded-pill text-bg-danger">${incumbencia}</span>` : `<span class="badge rounded-pill text-bg-warning">${incumbencia}</span>`;

            const rowHtml = `
                <tr>
                    <td>${formatarData(transf.dataTransferencia)}</td>
                    <td>${transf.numeroPatrimonialItem || 'N/A'}</td>
                    <td>${transf.descricaoItem || 'N/A'}</td>
                    <td>${incumbenciaHtml}</td>
                    <td>${transf.observacao || ''}</td>
                    <td>${transf.usuario ? transf.usuario.nome : 'Usuário desconhecido'}</td>
                    <td>${botaoDevolverHtml}</td>
                </tr>
            `;
            $tabelaHistoricoBody.append(rowHtml);
        });
    };

    const fetchHistory = (searchParams = {}) => {
        const queryString = $.param(searchParams);
        $.ajax({
            url: `/api/transferencias?${queryString}`,
            method: 'GET',
            dataType: 'json',
            success: (data) => {
                allTransfers = data;
                renderHistoryTable(allTransfers);
            },
            error: () => {
                $tabelaHistoricoBody.html('<tr><td colspan="7" class="text-center text-danger">Erro ao carregar o histórico.</td></tr>');
            }
        });
    };

    const popularCompartimentosDevolucao = () => {
        $.ajax({
            url: '/api/util/compartimentos',
            method: 'GET',
            success: function(compartimentos) {
                const $select = $('#devolucao-compartimento');
                $select.empty().append('<option value="">Selecione um compartimento...</option>');
                compartimentos.forEach(c => {
                    $select.append(`<option value="${c.name}">${c.descricao}</option>`);
                });
            }
        });
    };

    // --- MANIPULADORES DE EVENTOS ---
    $btnLogout.on('click', function() {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    $cabecalhoTabelaHistorico.on('click', 'th[data-sortable]', function() {
        const columnKey = $(this).data('column');
        if (!columnKey) return;
        const direction = (currentSort.column === columnKey && currentSort.direction === 'asc') ? 'desc' : 'asc';
        currentSort = { column: columnKey, direction: direction };
        $cabecalhoTabelaHistorico.find('i.sort-icon').remove();
        const iconClass = direction === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
        $(this).append(` <i class="bi ${iconClass} sort-icon text-warning"></i>`);
        renderHistoryTable();
    });

    $formBusca.on('submit', function(e) {
        e.preventDefault();
        const formDataArray = $(this).serializeArray();
        let searchParams = {};
        formDataArray.forEach(item => {
            if (item.value) {
                searchParams[item.name] = item.value;
            }
        });
        fetchHistory(searchParams);
    });

    $btnLimparBusca.on('click', function() {
        $formBusca[0].reset();
        fetchHistory();
    });

    $('body').on('click', '.btn-devolver', function() {
        const patrimonio = $(this).data('patrimonio');
        const descricao = $(this).data('descricao');

        // Preenche os dados no modal
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
                fetchHistory();
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON ? xhr.responseJSON.message : "Erro ao registrar devolução.";
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

    $themeToggler.on('change', function() {
        applyTheme($(this).is(':checked') ? 'dark' : 'light');
    });

    // --- INICIALIZAÇÃO ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    fetchHistory();
    popularCompartimentosDevolucao();
    setupUIForRole(userRole);
});
