$(function() {
    // --- SELETORES ---
    const $formTrocarSenha = $('#form-trocar-senha');
    const $trocaSenhaAlert = $('#troca-senha-alert');

    // Função para exibir alertas dentro do formulário
    const showAlertInForm = (message, type = 'danger') => {
        $trocaSenhaAlert.removeClass('d-none alert-danger alert-success').addClass(`alert-${type}`);
        $trocaSenhaAlert.text(message).removeClass('d-none');
    };

    // --- MANIPULADOR DE EVENTO ---
    $formTrocarSenha.on('submit', function(e) {
        e.preventDefault();
        $trocaSenhaAlert.addClass('d-none').text('');

        const novaSenha = $('#nova-senha').val();
        const confirmarNovaSenha = $('#confirmar-nova-senha').val();

        if (novaSenha !== confirmarNovaSenha) {
            showAlertInForm('A nova senha e a confirmação não coincidem.');
            return;
        }

        const dados = {
            novaSenha: novaSenha
        };

        $.ajax({
            url: '/api/perfil/definir-nova-senha',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function() {
                localStorage.removeItem('jwt_token');
                const successAlert = $(`<div class="alert alert-success">Senha alterada com sucesso! Redirecionando para o login...</div>`);
                $('#form-trocar-senha').html(successAlert);

                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 4000);
            },
            error: function(xhr) {
                let errorMsg = 'Ocorreu um erro inesperado ao tentar alterar a senha.';
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.errors && xhr.responseJSON.errors.length > 0) {
                        errorMsg = xhr.responseJSON.errors[0];
                    } else if (xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    }
                } else if (xhr.responseText) {
                    errorMsg = xhr.responseText;
                }
                showAlertInForm(errorMsg);
            }
        });
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    $('html').attr('data-bs-theme', savedTheme);
});
