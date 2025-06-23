package br.com.guardiao.guardiao.validation;

import br.com.guardiao.guardiao.validation.validator.StrongPasswordValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    String message() default "A senha deve conter no mínimo 6 caracteres, incluindo pelo menos uma letra maiúscula, " +
            "uma minúscula, um número e um caractere especial.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}