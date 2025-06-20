package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.model.Incumbencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/util")
public class UtilController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/incumbencias")
    public List<Map<String, String>> getIncumbencias() {
        return Arrays.stream(Incumbencia.values())
                .map(i -> Map.of(
                        "codigo", i.name(),
                        "descricao", i.getDescricao()
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/check-password/{rawPassword}")
    public String checkPassword(@PathVariable String rawPassword) {
        // Busca seu usuário admin no banco
        Usuario admin = usuarioRepository.findByEmail("dias.marcelo@marinha.mil.br").orElse(null);
        if (admin == null) {
            return "ERRO: Usuário 'dias.marcelo@marinha.mil.br' não foi encontrado no banco de dados!";
        }

        // Pega o hash que está armazenado
        String storedHash = admin.getPassword();

        // Usa o mesmo PasswordEncoder da aplicação para verificar se a senha bate com o hash
        boolean matches = passwordEncoder.matches(rawPassword, storedHash);

        // Retorna o resultado
        return "Verificando a senha '" + rawPassword + "'. O resultado é: " + matches;
    }

    /**
     * Controller para criar senha hash caso precise adicionar manualmente direto no banco.
     * @param plainPassword
     */
    //Coloque a senha em claro no no @param
    @GetMapping("/generate-hash/{plainPassword}")
    public String generateHash(@PathVariable String plainPassword) {
        String hashedPassword = passwordEncoder.encode(plainPassword);

        // Imprime o hash no console da sua IDE (IntelliJ, VSCode, etc.)
        System.out.println("====================================================================");
        System.out.println("HASH GERADO PARA A SENHA '" + plainPassword + "':");
        System.out.println(hashedPassword);
        System.out.println("====================================================================");

        // Retorna uma mensagem de confirmação para o navegador
        return "Hash gerado com sucesso! Verifique o console da sua IDE.";
    }
}