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
    const $btnConfirmarImportacao = $('#btn-confirmar-importacao');

    let itensValidosParaImportar = [];

    // --- FUNÇÕES ---
    const showAlert = (message, type = 'success') => {
        const $alert = $(`<div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 2050;">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`);
        $('body').append($alert);
        setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 5000);
    };

    const renderValidationTable = (resultados) => {
        $tabelaValidacaoBody.empty();
        itensValidosParaImportar = [];

        if (!resultados || resultados.length === 0) {
            $tabelaValidacaoBody.html('<tr><td colspan="7" class="text-center text-muted">Nenhum item encontrado no ficheiro ou o formato é inválido.</td></tr>');
            return;
        }

        resultados.forEach(resultado => {
            const item = resultado.item;
            const rowClass = resultado.valido ? '' : 'table-danger';
            const checkboxHtml = resultado.valido
                ? `<td><input class="form-check-input valid-item-checkbox" type="checkbox" value='${JSON.stringify(item)}'></td>`
                : '<td><i class="bi bi-x-circle-fill text-danger"></i></td>';

            const rowHtml = `
                <tr class="${rowClass}">
                    ${checkboxHtml}
                    <td>${item.numeroPatrimonial || ''}</td>
                    <td>${item.descricao || ''}</td>
                    <td>${item.marca || 'N/A'}</td>
                    <td>${item.numeroDeSerie || 'N/A'}</td>
                    <td>${item.compartimento.codigo || 'N/A'}</td>
                    <td class="badge rounded-pill text-bg-success">${resultado.mensagemErro}</td>
                </tr>
            `;
            $tabelaValidacaoBody.append(rowHtml);

            if (resultado.valido) {
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
