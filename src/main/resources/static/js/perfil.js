$(function() {

    // --- SELETORES ---
    const $formMeusDados = $('#form-meus-dados');
    const $formAlterarSenha = $('#form-alterar-senha');

    // --- FUNÇÕES ---
    const fetchAndPopulateProfile = () => {
        $.ajax({
            url: '/api/perfil/meus-dados',
            method: 'GET',
            success: function(user) {
                // Preenche os campos do formulário com os dados recebidos
                $('#perfil-login').val(user.login);
                $('#perfil-nome').val(user.nome);
                $('#perfil-email').val(user.email);
                $('#perfil-perfil').val(user.perfil);
            },
            error: function() {
                showAlert('Erro ao carregar os dados do perfil.', 'danger');
            }
        });
    };

    // --- MANIPULADORES DE EVENTOS ---
    // Evento para o formulário de atualização de dados pessoais
    $formMeusDados.on('submit', function(e) {
        e.preventDefault();

        const dados = {
            nome: $('#perfil-nome').val(),
            email: $('#perfil-email').val()
        };

        $.ajax({
            url: '/api/perfil/meus-dados',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function() {
                showAlert('Dados atualizados com sucesso!', 'success');
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Erro ao atualizar os dados.';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // Evento para o formulário de alteração de senha
    $formAlterarSenha.on('submit', function(e) {
        e.preventDefault();

        const senhaAtual = $('#senha-atual').val();
        const novaSenha = $('#nova-senha').val();
        const confirmarNovaSenha = $('#confirmar-nova-senha').val();

        if (senhaAtual === '') {
            showAlert('Digite a senha atual.', 'warning');
            return;
        }

        // Validação no frontend para garantir que as senhas coincidem
        if (novaSenha !== confirmarNovaSenha) {
            showAlert('A nova senha e a confirmação não coincidem.', 'warning');
            return;
        }

        const dados = {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha
        };

        $.ajax({
            url: '/api/perfil/alterar-senha',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function() {
                showAlert('Senha alterada com sucesso!');
                $formAlterarSenha[0].reset();
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Erro ao alterar a senha.';
                showAlert(errorMsg, 'danger');
            }
        });
    });

    // --- INICIALIZAÇÃO ---
    fetchAndPopulateProfile();
});
