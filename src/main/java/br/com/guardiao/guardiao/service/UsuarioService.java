package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
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

    private String senhaPadrao = "guardiao";

    @Transactional
    public Usuario registrarNovoUsuario(RegistroUsuarioDTO registroUsuarioDTO) {
        if (usuarioRepository.findByLogin(registroUsuarioDTO.getLogin()).isPresent()) {
            throw new IllegalStateException("O nome de usuário (login) informado já está em uso.");
        }
        if (usuarioRepository.findByEmail(registroUsuarioDTO.getEmail()).isPresent()) {
            throw new IllegalStateException("O e-mail informado já está cadastrado.");
        }

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(registroUsuarioDTO.getNome());
        novoUsuario.setLogin(registroUsuarioDTO.getLogin());
        novoUsuario.setEmail(registroUsuarioDTO.getEmail());
        novoUsuario.setSenha(passwordEncoder.encode(senhaPadrao));
        novoUsuario.setSenhaExpirada(true);
        novoUsuario.setPerfil(registroUsuarioDTO.getPerfil());
        novoUsuario.setStatus(StatusUsuario.ATIVO);

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

        usuarioRepository.findByLogin(dados.getLogin()).ifPresent(u -> {
            if (!u.getId().equals(id)) {
                throw new IllegalStateException("O nome de usuário (login) informado já está em uso.");
            }
        });
        usuarioRepository.findByEmail(dados.getEmail()).ifPresent(u -> {
            if (!u.getId().equals(id)) {
                throw new IllegalStateException("O e-mail informado já está em uso por outro usuário.");
            }
        });

        usuario.setNome(dados.getNome());
        usuario.setLogin(dados.getLogin());
        usuario.setEmail(dados.getEmail());
        usuario.setPerfil(dados.getPerfil());
        usuario.setStatus(dados.getStatus());

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
    public void definirNovaSenha(Usuario usuarioLogado, NovaSenhaDTO novaSenhaDTO) {
        usuarioLogado.setSenha(passwordEncoder.encode(novaSenhaDTO.getNovaSenha()));
        usuarioLogado.setSenhaExpirada(false);
        usuarioRepository.save(usuarioLogado);
    }

    @Transactional
    public void resetarSenha(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        usuario.setSenha(passwordEncoder.encode(senhaPadrao));
        usuario.setSenhaExpirada(true);

        usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario atualizarProprioPerfil(Usuario usuarioLogado, PerfilUpdateDTO dados) {
        usuarioRepository.findByEmail(dados.getEmail()).ifPresent(u -> {
            if (!u.getId().equals(usuarioLogado.getId())) {
                throw new IllegalStateException("O e-mail informado já está em uso por outro usuário.");
            }
        });
        usuarioLogado.setNome(dados.getNome());
        usuarioLogado.setEmail(dados.getEmail());

        return usuarioRepository.save(usuarioLogado);
    }

    @Transactional
    public void alterarPropriaSenha(Usuario usuarioLogado, SenhaUpdateDTO dados) {
        if (!passwordEncoder.matches(dados.getSenhaAtual(), usuarioLogado.getPassword())) {
            throw new BadCredentialsException("A senha atual está incorreta.");
        }
        usuarioLogado.setSenha(passwordEncoder.encode(dados.getNovaSenha()));
        usuarioRepository.save(usuarioLogado);
    }
}
