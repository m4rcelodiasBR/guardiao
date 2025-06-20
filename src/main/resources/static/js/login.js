$(function() {
    const $formLogin = $('#form-login');
    const $loginAlert = $('#login-alert');

    // Manipulador de submissão do formulário
    $formLogin.on('submit', function(e) {
        e.preventDefault();

        $loginAlert.addClass('d-none').text('');

        const data = {
            email: $('#email').val(),
            senha: $('#senha').val()
        };

        $.ajax({
            url: '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                // Se o login for bem-sucedido, o 'response' contém o token
                if (response && response.token) {
                    // Armazena o token no localStorage do navegador.
                    // O localStorage persiste os dados mesmo após fechar o navegador.
                    localStorage.setItem('jwt_token', response.token);

                    // Redireciona o usuário para a página principal do inventário
                    window.location.href = '/index.html';
                }
            },
            error: function(xhr) {
                let errorMsg = "E-mail ou senha inválidos. Tente novamente.";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                $loginAlert.text(errorMsg).removeClass('d-none');
            }
        });
    });
});
