package br.com.guardiao.guardiao.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class RestExceptionHandler {

    /**
     * Este metodo é acionado automaticamente sempre que uma validação
     * anotada com @Valid falha em qualquer um dos nossos Controllers.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", System.currentTimeMillis());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("errors", errors);

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, String> error = Map.of("message", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Manipulador para outras exceções de negócio, como login já existente.
     */
    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, String>> handleBusinessExceptions(IllegalStateException ex) {
        Map<String, String> error = Map.of("message", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT) // HTTP 409: Conflito
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String mensagem = "Erro de integridade de dados. Um valor único já existe no sistema.";

        Throwable rootCause = ex.getMostSpecificCause();
        if (rootCause.getMessage() != null) {
            String causeMessage = rootCause.getMessage().toLowerCase();
            if (causeMessage.contains("numero_patrimonial")) {
                mensagem = "Erro: Número Patrimonial já cadastrado.";
            } else if (causeMessage.contains("numero_de_serie")) {
                mensagem = "Erro: Número de Série já cadastrado.";
            }
        }

        Map<String, String> error = Map.of("message", mensagem);
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
}
