// Espera o documento carregar antes de executar o código
$(function() {

    // --- SELETORES ---
    const $tabelaHistoricoBody = $('#tabela-historico');
    const $formBusca = $('#form-busca-historico');
    const $inputBusca = $('#busca-patrimonio');

    // --- FUNÇÕES ---

    /**
     * Formata uma data no formato ISO (ex: "2025-06-13T18:20:47.123Z")
     * para um formato legível em pt-BR (ex: "13/06/2025 15:20:47").
     */
    const formatarData = (dataISO) => {
        if (!dataISO) return 'N/A';
        const data = new Date(dataISO);
        // Usamos toLocaleString para formatar data e hora de acordo com a localidade do navegador.
        return data.toLocaleString('pt-BR');
    };

    /**
     * Renderiza os dados do histórico na tabela.
     * @param {Array} transferencias - Um array de objetos de transferência.
     */
    const renderHistoryTable = (transferencias) => {
        $tabelaHistoricoBody.empty();

        if (transferencias.length === 0) {
            const emptyMsg = '<tr><td colspan="6" class="text-center text-muted">Nenhum registro encontrado.</td></tr>';
            $tabelaHistoricoBody.html(emptyMsg);
            return;
        }

        transferencias.forEach(transf => {
            const rowHtml = `
                <tr>
                    <td>${formatarData(transf.dataTransferencia)}</td>
                    <td>${transf.numeroPatrimonialItem || 'N/A'}</td>
                    <td>${transf.descricaoItem || 'N/A'}</td>
                    <td>${transf.incumbenciaDestino}</td>
                    <td>${transf.observacao || ''}</td>
                    <td>${transf.usuario ? transf.usuario.nome : 'Usuário desconhecido'}</td>
                </tr>
            `;
            $tabelaHistoricoBody.append(rowHtml);
        });
    };

    /**
     * Busca os dados na API. Se um termo de busca for fornecido,
     * ele busca por patrimônio. Caso contrário, busca o histórico completo.
     * @param {string} patrimonio - O número do patrimônio para buscar (opcional).
     */
    const fetchHistory = (patrimonio = '') => {
        let url = '/api/transferencias';
        let data = {};

        if (patrimonio) {
            // Se houver um termo de busca, montamos a URL de busca e os dados
            url = '/api/transferencias/busca';
            data = { patrimonio: patrimonio };
        }

        $.ajax({
            url: url,
            method: 'GET',
            data: data, // jQuery vai montar a query string para nós (ex: ?patrimonio=123)
            dataType: 'json',
            success: function(data) {
                renderHistoryTable(data);
            },
            error: function() {
                const errorMsg = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar o histórico.</td></tr>';
                $tabelaHistoricoBody.html(errorMsg);
            }
        });
    };

    // --- EVENTOS ---

    // Evento de submissão do formulário de busca
    $formBusca.on('submit', function(e) {
        e.preventDefault(); // Impede o recarregamento da página
        const termoBusca = $inputBusca.val().trim(); // Pega o valor do input e remove espaços
        fetchHistory(termoBusca);
    });

    // Limpa a busca e recarrega tudo se o usuário apagar o texto do input
    $inputBusca.on('input', function() {
        if ($(this).val().trim() === '') {
            fetchHistory();
        }
    });

    // --- INICIALIZAÇÃO ---
    // Carrega o histórico completo quando a página é aberta pela primeira vez.
    fetchHistory();
});
