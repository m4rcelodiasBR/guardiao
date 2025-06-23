package br.com.guardiao.guardiao.validation.validator;

import br.com.guardiao.guardiao.validation.StrongPassword;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return true;
        }

        // Regex que verifica se a senha tem:
        // (?=.*[0-9])       - pelo menos um dígito
        // (?=.*[a-z])       - pelo menos uma letra minúscula
        // (?=.*[A-Z])       - pelo menos uma letra maiúscula
        // (?=.*[@#$%^&+=!]) - pelo menos um caractere especial
        // (?=\\S+$)         - sem espaços em branco
        // .{6,}             - no mínimo 6 caracteres de comprimento
        String passwordPattern = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{6,}$";

        return password.matches(passwordPattern);
    }
}
