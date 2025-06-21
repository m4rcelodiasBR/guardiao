package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.RegistroUsuarioDTO;
import br.com.guardiao.guardiao.controller.dto.UsuarioUpdateDTO;
import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

    public List<Usuario> listarUsuariosVisiveis() {
        return usuarioRepository.findAll()
                .stream()
                .filter(usuario -> usuario.getStatus() != StatusUsuario.EXCLUIDO)
                .collect(Collectors.toList());
    }
    // O metodo de atualização agora também gerencia o status ATIVO/INATIVO
    @Transactional
    public Usuario atualizarUsuario(Integer id, UsuarioUpdateDTO dados) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setNome(dados.getNome());
        usuario.setEmail(dados.getEmail());
        usuario.setPerfil(dados.getPerfil());
        usuario.setStatus(dados.getStatus()); // Atualiza o status (ATIVO ou INATIVO)

        return usuarioRepository.save(usuario);
    }

    // A exclusão agora é uma exclusão lógica, mudando o status para EXCLUIDO
    @Transactional
    public void excluirUsuario(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setStatus(StatusUsuario.EXCLUIDO);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void resetarSenha(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        String senhaPadrao = "mudar123";
        usuario.setSenha(passwordEncoder.encode(senhaPadrao));

        usuarioRepository.save(usuario);
    }

}
