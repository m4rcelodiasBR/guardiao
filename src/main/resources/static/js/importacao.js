$(function() {

    if (userRole !== 'ADMIN') {
        alert('Acesso negado. Você não tem permissão para visualizar esta página.');
        window.location.href = '/index.html';
        return;
    }

    // --- SELETORES DA PÁGINA DE IMPORTAÇÃO ---
    const $formUpload = $('#form-upload');
    const $fileInput = $('#xml-file-input');
    const $btnValidar = $('#btn-validar-arquivo');
    const $areaResultados = $('#area-resultados');
    const $progressBar = $('#progress-bar');
    const $tabelaValidacaoBody = $('#tabela-validacao');
    const $selectAllValidCheckbox = $('#select-all-valid-checkbox');
    const $btnConfirmarImportacao = $('.btn-confirmar-importacao');

    let itensValidosParaImportar = [];

    // --- FUNÇÕES ---
    const renderValidationTable = (resultados) => {
        $tabelaValidacaoBody.empty();
        itensValidosParaImportar = []; // Limpa a lista de itens válidos

        if (!resultados || resultados.length === 0) {
            $tabelaValidacaoBody.html('<tr><td colspan="7" class="text-center text-muted">Nenhum item encontrado no ficheiro ou o formato é inválido.</td></tr>');
            return;
        }

        resultados.forEach(resultado => {
            const item = resultado.item;
            let rowClass = '';
            let checkboxHtml = '<td><i class="bi bi-x-circle-fill text-danger"></i></td>';
            let badgeClass = 'text-bg-danger';

            switch (resultado.status) {
                case 'VALIDO':
                    rowClass = 'table-success';
                    badgeClass = 'text-bg-success';
                    checkboxHtml = `<td><input class="form-check-input valid-item-checkbox" type="checkbox" value='${JSON.stringify(item)}'></td>`;
                    break;
                case 'VALIDO_COM_AVISO':
                    rowClass = 'table-warning';
                    badgeClass = 'text-bg-warning';
                    checkboxHtml = `<td><input class="form-check-input valid-item-checkbox" type="checkbox" value='${JSON.stringify(item)}'></td>`;
                    break;
                case 'INVALIDO':
                    rowClass = 'table-danger';
                    badgeClass = 'text-bg-danger';
                    checkboxHtml = '<td><i class="bi bi-x-circle-fill text-danger"></i></td>';
                    break;
            }

            const rowHtml = `
            <tr class="${rowClass}">
                ${checkboxHtml}
                <td>${item.numeroPatrimonial || ''}</td>
                <td>${item.descricao || ''}</td>
                <td>${item.marca || 'N/A'}</td>
                <td>${item.numeroDeSerie || 'N/A'}</td>
                <td>${item.compartimento?.codigo || 'N/A'}</td>
                <td><span class="badge rounded-pill ${badgeClass}">${resultado.mensagem}</span></td>
            </tr>
        `;
            $tabelaValidacaoBody.append(rowHtml);

            if (resultado.status !== 'INVALIDO') {
                itensValidosParaImportar.push(item);
            }
        });
    };

    const updateConfirmButtonState = () => {
        const selectedCount = $('.valid-item-checkbox:checked').length;
        $btnConfirmarImportacao.prop('disabled', selectedCount === 0);
    };

    // --- EVENTOS ---
    $formUpload.on('submit', function(e) {
        e.preventDefault();
        const file = $fileInput[0].files[0];
        if (!file) {
            showAlert('Por favor, selecione um ficheiro XML.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        $btnValidar.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando...');
        $areaResultados.slideDown();

        $.ajax({
            url: '/api/importacao/validar',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener('progress', function(evt) {
                    if (evt.lengthComputable) {
                        const percentComplete = Math.round((evt.loaded / evt.total) * 100);
                        $progressBar.width(percentComplete + '%').text(percentComplete + '%');
                    }
                }, false);
                return xhr;
            },
            success: function(resultados) {
                $progressBar.addClass('bg-success').text('Validação Concluída');
                renderValidationTable(resultados);
                updateConfirmButtonState();
            },
            error: function() {
                showAlert('Erro ao validar o ficheiro. Verifique o formato do XML.', 'danger');
                $progressBar.addClass('bg-danger').text('Falha na Validação');
            },
            complete: function() {
                $btnValidar.prop('disabled', false).html('<i class="bi bi-shield-check me-1"></i> Validar Ficheiro');
            }
        });
    });

    $selectAllValidCheckbox.on('change', function() {
        const isChecked = $(this).is(':checked');
        $('.valid-item-checkbox').prop('checked', isChecked);
        updateConfirmButtonState();
    });

    $tabelaValidacaoBody.on('change', '.valid-item-checkbox', function() {
        const totalValidos = $('.valid-item-checkbox').length;
        const totalSelecionados = $('.valid-item-checkbox:checked').length;
        $selectAllValidCheckbox.prop('checked', totalValidos > 0 && totalValidos === totalSelecionados);
        updateConfirmButtonState();
    });

    $btnConfirmarImportacao.on('click', function() {
        const itensSelecionados = [];
        $('.valid-item-checkbox:checked').each(function() {
            // 1. Converte o valor do checkbox (string JSON) para um objeto JS
            const itemCompleto = JSON.parse($(this).val());
            const itemParaEnviar = {
                ...itemCompleto,
                compartimento: itemCompleto.compartimento.codigo
            };
            itensSelecionados.push(itemParaEnviar);
        });

        if (itensSelecionados.length === 0) {
            showAlert('Nenhum item válido selecionado para importação.', 'warning');
            return;
        }

        $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Importando...');

        $.ajax({
            url: '/api/importacao/confirmar',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(itensSelecionados),
            success: function(response) {
                showAlert(response.message, 'success');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            },
            error: function(xhr) {
                showAlert(xhr.responseJSON?.message || 'Ocorreu um erro ao confirmar a importação.', 'danger');
                $('#btn-confirmar-importacao').prop('disabled', false).html('<i class="bi bi-check-circle-fill me-1"></i> Confirmar Importação');
            }
        });
    });
});
