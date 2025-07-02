package br.com.guardiao.guardiao.config;

import br.com.guardiao.guardiao.model.Perfil;
import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.findByLogin("admin").isEmpty()) {

            System.out.println("Nenhum usuário 'admin' encontrado, criando usuário padrão...");

            Usuario admin = new Usuario();
            admin.setNome("Administrador Padrão");
            admin.setLogin("admin");
            admin.setEmail("admin@guardiao.com");
            admin.setSenha(passwordEncoder.encode("guardiao"));
            admin.setPerfil(Perfil.ADMIN);
            admin.setStatus(StatusUsuario.ATIVO);
            admin.setSenhaExpirada(true);

            usuarioRepository.save(admin);

            System.out.println("Usuário 'admin' criado com sucesso com a senha padrão 'guardiao'.");
        } else {
            System.out.println("Usuário 'admin' já existe no banco de dados. Nenhuma ação necessária.");
        }
    }
}