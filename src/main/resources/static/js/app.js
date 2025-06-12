$(function() {

    const $themeToggler = $('#theme-toggler');
    const $tabelaInventarioBody = $('#tabela-inventario');

    // Formulários
    const $formNovoItem = $('#form-novo-item');
    const $formTransferencia = $('#form-transferencia');

    // Botão de confirmação do modal
    const $btnConfirmarAcao = $('#btn-confirmar-acao');

    // Variáveis de estado
    let allItems = [];
    let acaoConfirmada = null;

    // --- FUNÇÕES DE LÓGICA ---

    // Função para exibir alertas dinâmicos
    const showAlert = (message, type = 'success') => {
        // jQuery facilita a criação e manipulação de HTML
        const $alert = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 2000;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        $('body').append($alert);
        setTimeout(() => $alert.fadeOut(500, () => $alert.remove()), 4000);
    };

    // Função para buscar e exibir os itens usando AJAX
    const fetchAndDisplayItems = () => {
        // Esta é a principal função AJAX do jQuery.
        $.ajax({
            url: '/api/itens',
            method: 'GET',
            dataType: 'json', // Esperamos receber um JSON de volta
            success: function(data) {
                // 'data' já é o objeto/array JSON parseado
                allItems = data;
                renderTable(allItems);
            },
            error: function(xhr, status, error) {
                // Tratamento de erro
                console.error("Erro ao buscar itens:", status, error);
                const errorMsg = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar inventário.</td></tr>';
                $tabelaInventarioBody.html(errorMsg); // .html() é o equivalente a .innerHTML
            }
        });
    };

    // Função para renderizar a tabela
    const renderTable = (items) => {
        $tabelaInventarioBody.empty(); // .empty() é a forma jQuery de limpar o conteúdo de um elemento

        if (items.length === 0) {
            const emptyMsg = '<tr><td colspan="8" class="text-center text-muted">Nenhum item disponível.</td></tr>';
            $tabelaInventarioBody.html(emptyMsg);
            return;
        }

        items.forEach(item => {
            // Criamos a linha da tabela como uma string HTML
            const rowHtml = `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.numeroPatrimonial || 'N/A'}</td>
                    <td>${item.descricao}</td>
                    <td>${item.marca || 'N/A'}</td>
                    <td>${item.numeroDeSerie || 'N/A'}</td>
                    <td>${item.localizacao || 'N/A'}</td>
                    <td>${item.compartimento || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-transferir" title="Transferir"
                            data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-excluir" title="Excluir"
                            data-patrimonio="${item.numeroPatrimonial}" data-descricao="${item.descricao}">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </td>
                </tr>
            `;
            $tabelaInventarioBody.append(rowHtml); // .append() adiciona o conteúdo ao final do elemento
        });
    };

    // --- MANIPULADORES DE EVENTOS (EVENT HANDLERS) ---
    // Usamos delegação de eventos, uma das funcionalidades mais poderosas do jQuery.
    // O evento é "escutado" no 'body', mas só é disparado se o clique foi em um elemento
    // que corresponde ao seletor (ex: '.btn-excluir').

    $('body').on('click', '.btn-excluir', function() {
        // Dentro de um handler do jQuery, 'this' se refere ao elemento que disparou o evento.
        const $button = $(this);
        const patrimonio = $button.data('patrimonio'); // .data('nome') é como o jQuery acessa data-attributes
        const descricao = $button.data('descricao');

        $('#confirm-title').text('Confirmar Exclusão');
        $('#confirm-body').text(`Tem certeza que deseja excluir o item: ${descricao} (Patrimônio: ${patrimonio})? Esta ação não pode ser desfeita.`);

        acaoConfirmada = () => handleDelete(patrimonio);
        $('#modalConfirmacao').modal('show'); // Sintaxe do Bootstrap para controlar modais com jQuery
    });

    $('body').on('click', '.btn-transferir', function() {
        const $button = $(this);
        const patrimonio = $button.data('patrimonio');
        const descricao = $button.data('descricao');

        $('#item-a-transferir-descricao').text(descricao);
        $('#transfer-patrimonio').val(patrimonio); // .val() é usado para ler/escrever em campos de formulário

        $('#modalTransferencia').modal('show');
    });

    // Confirmação genérica
    $btnConfirmarAcao.on('click', function() {
        if (typeof acaoConfirmada === 'function') {
            acaoConfirmada();
        }
        $('#modalConfirmacao').modal('hide');
        acaoConfirmada = null;
    });

    // --- SUBMISSÃO DOS FORMULÁRIOS COM AJAX ---

    $formNovoItem.on('submit', function(e) {
        e.preventDefault(); // Previne o recarregamento da página

        // .serializeArray() pega os dados do form e os transforma num array de objetos
        const formDataArray = $(this).serializeArray();
        let data = {};
        formDataArray.forEach(item => {
            data[item.name] = item.value;
        });

        $.ajax({
            url: '/api/itens',
            method: 'POST',
            contentType: 'application/json', // Informa ao servidor que estamos enviando JSON
            data: JSON.stringify(data), // Converte o objeto JS para uma string JSON
            success: function() {
                showAlert('Item cadastrado com sucesso!');
                $formNovoItem[0].reset(); // Reseta o formulário
                $('#modalNovoItem').modal('hide');
                fetchAndDisplayItems(); // Atualiza a tabela
            },
            error: function() {
                showAlert('Erro ao cadastrar item.', 'danger');
            }
        });
    });

    $formTransferencia.on('submit', function(e) {
        e.preventDefault();

        const data = {
            numeroPatrimonial: $('#transfer-patrimonio').val(),
            incumbenciaDestino: $('#transfer-destino').val(),
            observacao: $('#transfer-obs').val()
        };

        $.ajax({
            url: '/api/transferencias',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                showAlert('Transferência registrada com sucesso!');
                $formTransferencia[0].reset();
                $('#modalTransferencia').modal('hide');
                fetchAndDisplayItems(); // O item transferido sumirá da lista
            },
            error: function() {
                showAlert('Erro ao registrar transferência.', 'danger');
            }
        });
    });

    // Função que executa a exclusão via AJAX
    const handleDelete = (patrimonio) => {
        $.ajax({
            url: `/api/itens/${patrimonio}`,
            method: 'DELETE',
            success: function() {
                showAlert('Item excluído com sucesso!');
                fetchAndDisplayItems();
            },
            error: function() {
                showAlert('Erro ao excluir item.', 'danger');
            }
        });
    };

    // --- LÓGICA DO MODO ESCURO (SEM ALTERAÇÃO) ---
    const applyTheme = (theme) => {
        $('html').attr('data-bs-theme', theme); // Usando jQuery para setar o atributo
        localStorage.setItem('theme', theme);
        $themeToggler.prop('checked', theme === 'dark'); // .prop() para propriedades como 'checked'
    };

    $themeToggler.on('change', function() {
        applyTheme($(this).is(':checked') ? 'dark' : 'light');
    });

    // --- INICIALIZAÇÃO ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    fetchAndDisplayItems(); // Carrega os dados iniciais ao abrir a página
});
