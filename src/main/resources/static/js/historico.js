$(document).on('global-setup-complete', function() {

    const urlParams = new URLSearchParams(window.location.search);
    const patrimonioFromUrl = urlParams.get('patrimonio');
    if (patrimonioFromUrl) {
        $('#busca-patrimonio').val(patrimonioFromUrl);
    }

    // --- SELETORES ---
    const $formBusca = $('#form-busca-historico-avancada');
    const $btnLimparBusca = $('#btn-limpar-busca-historico');
    const $formDevolucao = $('#form-devolucao');
    const modalDevolucao = new bootstrap.Modal(document.getElementById('modalDevolucao'));
    const modalObservacoes = new bootstrap.Modal(document.getElementById('modalObservacoes'));

    // --- FUNÇÕES ---
    const formatarData = (dataISO) => {
        if (!dataISO) return '';
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        return new Date(dataISO).toLocaleString('pt-BR', options);
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

    const dataTable = $('#datatable-historico').DataTable({
        serverSide: true,
        responsive: true,
        processing: true,
        ajax: function (data, callback, settings) {
            const formDataArray = $formBusca.serializeArray();
            let buscaAvancada = {};
            formDataArray.forEach(item => { if (item.value) { buscaAvancada[item.name] = item.value; } });

            const dtParams = {
                draw: data.draw,
                start: data.start,
                length: data.length,
            };

            if (data.order && data.order.length > 0) {
                dtParams['order[0][column]'] = data.order[0].column;
                dtParams['order[0][dir]'] = data.order[0].dir;
            }

            const url = '/api/transferencias/datatable?' + $.param(dtParams);

            $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(buscaAvancada),
                success: function(json) {
                    callback(json);
                },
                error: function() {
                    showAlert('Erro ao carregar histórico.', 'danger');
                    callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
                }
            });
        },
        columns: [
            { data: 'transferencia.dataTransferencia', render: (data) => formatarData(data) },
            { data: 'transferencia.numeroPatrimonialItem', defaultContent: '' },
            {
                data: 'transferencia.descricaoItem',
                render: $.fn.dataTable.render.ellipsis(80, true) },
            {
                data: 'transferencia.incumbenciaDestino',
                render: function(data) {
                    if (!data) return '';
                    const isBaixaDefinitiva = ["000", "001", "002"].some(prefix => data.startsWith(prefix));
                    const badgeClass = isBaixaDefinitiva ? 'text-bg-danger' : 'text-bg-warning';
                    return `<span class="badge rounded-pill ${badgeClass}">${data}</span>`;
                }
            },
            {
                data: 'transferencia.observacao',
                orderable: false,
                searchable: false,
                render: function(data) {
                    if (!data) return '';
                    const obsEscapada = $('<textarea />').text(data).html();
                    return `<button class="btn btn-xs btn-secondary btn-ver-obs" data-obs="${obsEscapada}" title="Ver observações"><i class="bi bi-eye-fill"></i></button>`;
                }
            },
            { data: 'transferencia.usuario.nome', defaultContent: 'N/A' },
            {
                data: 'podeSerDevolvido',
                orderable: false,
                searchable: false,
                render: function(data, type, row) {
                    if (data) {
                        const patrimonio = row.transferencia.numeroPatrimonialItem;
                        const descricao = $('<textarea />').text(row.transferencia.descricaoItem).html();
                        return `<button class="btn btn-xs btn-success btn-devolver" title="Registar Devolução" data-patrimonio="${patrimonio}" data-descricao="${descricao}"><i class="bi bi-box-arrow-in-left"></i></button>`;
                    }
                    return '';
                }
            }
        ],
        language: { url: '/js/datatables-traducoes/pt-BR.json' },
        order: [[0, 'desc']],
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
    $formBusca.on('submit', (e) => {
        e.preventDefault();
        dataTable.ajax.reload();
    });

    $btnLimparBusca.on('click', () => {
        $formBusca[0].reset();
        dataTable.ajax.reload();
    });

    $('#datatable-historico tbody').on('click', 'button', function() {
        const $button = $(this);
        if ($button.hasClass('btn-ver-obs')) {
            const observacaoTexto = $button.data('obs');
            $('#modalObservacoesLabel').text('Observação da Transferência');
            $('#modalObservacoesBody').text(observacaoTexto);
            modalObservacoes.show();
        } else if ($button.hasClass('btn-devolver')) {
            const patrimonio = $button.data('patrimonio');
            const descricao = $button.data('descricao');
            $('#devolucao-patrimonio').val(patrimonio);
            $('#devolucao-item-descricao').text(`${descricao} (NumPAT: ${patrimonio})`);
            modalDevolucao.show();
        }
    });

    $formDevolucao.on('submit', function(e) {
        e.preventDefault();
        const $submitButton = $(this).find('button[type="submit"]');
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
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Devolvendo...');
            },
            success: function() {
                modalDevolucao.hide();
                $formDevolucao[0].reset();
                showAlert('Devolução registada com sucesso! O item está de volta no Inventário', 'success');
                dataTable.ajax.reload();
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || "Erro ao registar devolução.", 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Confirmar Devolução');
            }
        });
    });

    // --- INICIALIZAÇÃO ---
    popularCompartimentosDevolucao();
});
