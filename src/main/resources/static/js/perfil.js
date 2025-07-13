$(function() {

    // --- SELETORES ---
    const $formMeusDados = $('#form-meus-dados');
    const $formAlterarSenha = $('#form-alterar-senha');

    // --- LÓGICA DE VALIDAÇÃO DE SENHA EM TEMPO REAL ---
    const $novaSenhaInput = $('#nova-senha');
    const $confirmarSenhaInput = $('#confirmar-nova-senha');
    const $btnAlterarSenha = $('#btn-alterar-senha');
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
    $novaSenhaInput.on('keyup', validatePassword);

    $confirmarSenhaInput.on('keyup', validatePassword);

    $formMeusDados.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
        const dados = {
            nome: $('#perfil-nome').val(),
            email: $('#perfil-email').val()
        };
        $.ajax({
            url: '/api/perfil/meus-dados',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...');
            },
            success: function() {
                showAlert('Dados atualizados com sucesso!', 'success');
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Erro ao atualizar os dados.';
                showAlert(errorMsg, 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Salvar Alterações');
            }
        });
    });

    $formAlterarSenha.on('submit', function(e) {
        e.preventDefault();
        const $form = $(this);
        const $submitButton = $form.find('button[type="submit"]');
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
            beforeSend: function() {
                $submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Alterando...');
            },
            success: function() {
                showAlert('Senha alterada com sucesso!');
                $formAlterarSenha[0].reset();
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
                showAlert(errorMsg, 'danger');
            },
            complete: function() {
                $submitButton.prop('disabled', false).text('Alterar Senha');
            }
        });
    });

    // --- INICIALIZAÇÃO ---
    fetchAndPopulateProfile();
});

function togglePasswordVisibility(buttonSelector, inputSelector) {
    $(buttonSelector).on('click', function() {
        const passwordField = $(inputSelector);
        const fieldType = passwordField.attr('type');
        if (fieldType === 'password') {
            passwordField.attr('type', 'text');
            $(this).removeClass('bi-eye-slash-fill').addClass('bi-eye-fill');
        } else {
            passwordField.attr('type', 'password');
            $(this).removeClass('bi-eye-fill').addClass('bi-eye-slash-fill');
        }
    });
}

togglePasswordVisibility('#toggle-senha-atual', '#senha-atual');
togglePasswordVisibility('#toggle-nova-senha-perfil', '#nova-senha');
togglePasswordVisibility('#toggle-confirmar-senha-perfil', '#confirmar-nova-senha');
