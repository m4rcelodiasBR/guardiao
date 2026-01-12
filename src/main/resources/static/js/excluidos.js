$(document).on('global-setup-complete', function() {

    if (userRole !== 'ADMIN') {
        showAlert('Acesso negado. Redirecionando...', 'danger');
        setTimeout(() => window.location.href = '/index.html', 1500);
        return;
    }

    const $selectAllCheckbox = $('#select-all-checkbox');
    const $selectionCounter = $('#selection-counter');
    const bulkActionsCollapse = new bootstrap.Collapse($('#bulk-actions-collapse')[0], { toggle: false });
    const modalConfirmacao = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
    const $btnConfirmarAcao = $('#btn-confirmar-acao');

    let acaoConfirmada = null;
    let selectedItems = new Set();

    const updateBulkActionUI = () => {
        const count = selectedItems.size;
        if (count > 1) {
            $selectionCounter.text(`${count} item(ns) selecionado(s)`);
            bulkActionsCollapse.show();
        } else {
            bulkActionsCollapse.hide();
        }
        const totalCheckboxes = $('.item-checkbox').length;
        const totalChecked = $('.item-checkbox:checked').length;
        $selectAllCheckbox.prop('checked', totalCheckboxes > 0 && totalChecked === totalCheckboxes);
    };

    const dataTable = $('#datatable-lixeira').DataTable({
        serverSide: true,
        responsive: true,
        processing: true,
        ajax: function (data, callback, settings) {
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

            $.ajax({
                url: '/api/itens/excluidos/datatable?' + $.param(dtParams),
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({}), // Busca vazia (sem filtros avançados por enquanto)
                success: function(json) {
                    selectedItems.clear();
                    updateBulkActionUI();
                    callback(json);
                },
                error: function() {
                    showAlert('Erro ao carregar lixeira.', 'danger');
                    callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
                }
            });
        },
        columns: [
            {
                data: null, orderable: false, searchable: false,
                render: function (data, type, row) {
                    return `<input class="form-check-input item-checkbox" type="checkbox" value="${row.item.numeroPatrimonial}">`;
                }
            },
            {
                data: 'item.status',
                render: function() { return '<span class="badge rounded-pill bg-danger" title="Excluído" style="cursor: pointer;>E</span>'; }
            },
            { data: 'item.numeroPatrimonial' },
            { data: 'item.descricao', render: $.fn.dataTable.render.ellipsis(80, true) },
            { data: 'item.marca', defaultContent: '' },
            { data: 'item.numeroDeSerie', defaultContent: '' },
            { data: 'item.localizacao', defaultContent: '' },
            { data: 'item.compartimento.codigo', defaultContent: '' },
            {
                data: null, orderable: false, searchable: false,
                render: function(data, type, row) {
                    return `<button class="btn btn-xs btn-success btn-restaurar" title="Restaurar este item"><i class="bi bi-recycle"></i></button>`;
                }
            }
        ],
        language: { url: '/js/datatables-traducoes/pt-BR.json' },
        order: [[2, 'asc']],
        dom: "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-md-end'f>>" +
            "<'row my-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row my-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 d-flex justify-content-md-end'p>>",
        lengthMenu: [
            [5, 10, 25, 50, 100],
            ['5', '10', '25', '50', '100']
        ],
        pageLength: 5
    });

    // --- EVENTOS ---
    $('#datatable-lixeira tbody').on('change', '.item-checkbox', function() {
        const val = $(this).val();
        if($(this).is(':checked')) selectedItems.add(val);
        else selectedItems.delete(val);
        updateBulkActionUI();
    });

    $selectAllCheckbox.on('change', function() {
        const isChecked = $(this).is(':checked');
        $('.item-checkbox').prop('checked', isChecked).trigger('change');
    });

    $('#datatable-lixeira tbody').on('click', '.btn-restaurar', function() {
        const rowData = dataTable.row($(this).parents('tr')).data();
        const patrimonio = rowData.item.numeroPatrimonial;
        const descricao = rowData.item.descricao;

        $('#confirm-title').text('Confirmar Restauração');
        $('#confirm-body').html(`Deseja restaurar o item:<br><strong>${descricao}</strong>?<br><br>Ele voltará para o status DISPONÍVEL.`);

        acaoConfirmada = () => {
            $.ajax({
                url: `/api/itens/${patrimonio}/restaurar`,
                method: 'PUT',
                success: () => {
                    showAlert('Item restaurado com sucesso!');
                    modalConfirmacao.hide();
                    dataTable.ajax.reload();
                },
                error: () => showAlert('Erro ao restaurar item.', 'danger')
            });
        };
        modalConfirmacao.show();
    });

    $('#btn-restaurar-selecionados').on('click', function() {
        if(selectedItems.size === 0) return;

        $('#confirm-title').text('Restauração em Massa');
        $('#confirm-body').text(`Deseja restaurar os ${selectedItems.size} itens selecionados? Eles voltarão para o inventário ativo.`);

        acaoConfirmada = () => {
            $.ajax({
                url: '/api/itens/restaurar-massa',
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(Array.from(selectedItems)),
                success: () => {
                    showAlert(`${selectedItems.size} itens restaurados!`);
                    selectedItems.clear();
                    updateBulkActionUI();
                    modalConfirmacao.hide();
                    dataTable.ajax.reload();
                },
                error: () => showAlert('Erro na restauração em massa.', 'danger')
            });
        };
        modalConfirmacao.show();
    });

    $btnConfirmarAcao.on('click', function() {
        if (typeof acaoConfirmada === 'function') acaoConfirmada();
    });
});