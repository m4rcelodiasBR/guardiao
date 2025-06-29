package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByLogin(String login);

    Page<Usuario> findAllByStatusNot(StatusUsuario status, Pageable pageable);
}