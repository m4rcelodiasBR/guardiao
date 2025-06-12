package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {}