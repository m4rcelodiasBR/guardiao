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
                if (response && response.token) {
                    localStorage.setItem('jwt_token', response.token);
                    window.location.href = '/index.html';
                }
            },
            error: function(xhr) {
                const errorMsg = xhr.responseText || "E-mail ou senha inválidos. Tente novamente.";
                $loginAlert.text(errorMsg).removeClass('d-none');
            }
        });
    });
});
