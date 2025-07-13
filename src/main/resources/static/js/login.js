$(function() {
    const $formLogin = $('#form-login');
    const $loginAlert = $('#login-alert');

    $formLogin.on('submit', function(e) {
        e.preventDefault();

        $loginAlert.addClass('d-none').text('');

        const data = {
            login: $('#login').val(),
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
                    if (response.trocaSenhaObrigatoria) {
                        window.location.href = '/trocar-senha.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                }
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || "Login ou senha inválidos. Tente novamente.";
                $loginAlert.text(errorMsg).removeClass('d-none');
            }
        });
    });
});

$('#toggle-senha').on('click', function() {
    const passwordField = $('#senha');
    const fieldType = passwordField.attr('type');

    if (fieldType === 'password') {
        passwordField.attr('type', 'text');
        $(this).removeClass('bi-eye-slash-fill').addClass('bi-eye-fill');
    } else {
        passwordField.attr('type', 'password');
        $(this).removeClass('bi-eye-fill').addClass('bi-eye-slash-fill');
    }
});
