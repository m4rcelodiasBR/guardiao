package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.RegistroUsuarioDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario registrarNovoUsuario(RegistroUsuarioDTO registroUsuarioDTO) {
        if (usuarioRepository.findByEmail(registroUsuarioDTO.getEmail()).isPresent()) {
            throw new IllegalStateException("O e-mail informado já está cadastrado.");
        }

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(registroUsuarioDTO.getNome());
        novoUsuario.setEmail(registroUsuarioDTO.getEmail());
        novoUsuario.setSenha(passwordEncoder.encode(registroUsuarioDTO.getSenha()));
        novoUsuario.setPerfil(registroUsuarioDTO.getPerfil());

        return usuarioRepository.save(novoUsuario);
    }

    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }
}
