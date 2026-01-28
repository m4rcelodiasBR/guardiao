$(document).on('global-setup-complete', function() {

    if (userRole !== 'ADMIN') {
        showAlert('Acesso negado. Redirecionando...', 'danger');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    const dataTable = $('#datatable-auditoria').DataTable({
        serverSide: true,
        processing: true,
        ordering: false,
        searching: true,
        responsive: true,
        ajax: {
            url: '/api/auditoria/datatable',
            type: 'POST'
        },
        columns: [
            { data: 'id' },
            {
                data: 'dataHora',
                render: function(data) {
                    if(!data) return '-';
                    return new Date(data).toLocaleString('pt-BR');
                }
            },
            {
                data: 'usuarioNome',
                render: function(data, type, row) {
                    return `<strong>${data || 'Sistema'}</strong><br><small class="text-muted">ID: ${row.usuarioId || '-'}</small>`;
                }
            },
            {
                data: 'tipoAcao',
                render: function(data) {
                    let color = 'primary';
                    let textColor = 'text-white';
                    if(data.includes('RESTAURACAO') || data.includes('LOGIN_SUCESSO')) color = 'success';
                    if(data.includes('EXCLUSAO') || data.includes('LOGIN_FALHA')) color = 'danger';
                    if(data.includes('TRANSFERENCIA') || data.includes('DEVOLUCAO')) {
                        color = 'warning';
                        textColor = 'text-dark';
                    }
                    return `<span class="badge bg-${color} ${textColor}">${data}</span>`;
                }
            },
            { data: 'objetoAfetado' },
            {
                data: 'detalhe',
                render: function(data) {
                    if (!data) return '';
                    let formatado = data.replace(/; /g, '<br>• ');
                    if(data.includes(';')) formatado = '• ' + formatado;
                    return `<span>${formatado}</span>`;
                }
            }
        ],
        language: { url: '/js/datatables-traducoes/pt-BR.json' },
        dom: "<'row mb-2'<'col-sm-12'f>>" +
            "<'row mb-2'<'col-sm-6'l><'col-sm-6 col-md-6 d-flex justify-content-md-end align-items-center'<'#buttons-title-placeholder-audit'>B>>" +
            "<'row my-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>" +
            "<'row'<'col-12'tr>>" +
            "<'row my-2'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>",
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
        $('#buttons-title-placeholder-audit').html('<span class="me-2">Exportar:</span>');
    });

    dataTable.on('draw.dt', function () {
        $('.dt-buttons').removeClass('btn-group').addClass('btn-group-sm');
    });
});