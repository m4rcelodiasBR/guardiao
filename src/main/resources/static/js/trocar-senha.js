$(function() {
    // --- SELETORES ---
    const $formTrocarSenha = $('#form-trocar-senha');
    const $trocaSenhaAlert = $('#troca-senha-alert');

    // --- LÓGICA DE VALIDAÇÃO DE SENHA EM TEMPO REAL ---
    const $novaSenhaInput = $('#nova-senha');
    const $confirmarSenhaInput = $('#confirmar-nova-senha');
    const $btnAlterarSenha = $('#btn-trocar-senha');
    const $passwordMatchError = $('#password-match-error');

    // Seletores das regras
    const $ruleLength = $('#rule-length');
    const $ruleUppercase = $('#rule-uppercase');
    const $ruleLowercase = $('#rule-lowercase');
    const $ruleNumber = $('#rule-number');
    const $ruleSpecial = $('#rule-special');
    const allRules = [$ruleLength, $ruleUppercase, $ruleLowercase, $ruleNumber, $ruleSpecial];

    // --- FUNÇÕES ---
    const validatePassword = () => {
        const password = $novaSenhaInput.val();
        let isFormValid = true;

        if (password.length >= 6) {
            $ruleLength.removeClass('invalid').addClass('valid');
        } else {
            $ruleLength.removeClass('valid').addClass('invalid');
            isFormValid = false;
        }

        if (/[A-Z]/.test(password)) {
            $ruleUppercase.removeClass('invalid').addClass('valid');
        } else {
            $ruleUppercase.removeClass('valid').addClass('invalid');
            isFormValid = false;
        }

        if (/[a-z]/.test(password)) {
            $ruleLowercase.removeClass('invalid').addClass('valid');
        } else {
            $ruleLowercase.removeClass('valid').addClass('invalid');
            isFormValid = false;
        }

        if (/[0-9]/.test(password)) {
            $ruleNumber.removeClass('invalid').addClass('valid');
        } else {
            $ruleNumber.removeClass('valid').addClass('invalid');
            isFormValid = false;
        }

        if (/[@#$%^&+=!]/.test(password)) {
            $ruleSpecial.removeClass('invalid').addClass('valid');
        } else {
            $ruleSpecial.removeClass('valid').addClass('invalid');
            isFormValid = false;
        }

        const passwordsMatch = password === $confirmarSenhaInput.val();
        if (passwordsMatch) {
            $passwordMatchError.hide();
        } else {
            if ($confirmarSenhaInput.val()) {
                $passwordMatchError.show();
            }
            isFormValid = false;
        }

        $btnAlterarSenha.prop('disabled', !isFormValid);
    };

    const showAlertInForm = (message, type = 'danger') => {
        $trocaSenhaAlert.removeClass('d-none alert-danger alert-success').addClass(`alert-${type}`);
        $trocaSenhaAlert.text(message).removeClass('d-none');
    };

    // --- MANIPULADOR DE EVENTO ---
    $novaSenhaInput.on('keyup', validatePassword);

    $confirmarSenhaInput.on('keyup', validatePassword);

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
});
