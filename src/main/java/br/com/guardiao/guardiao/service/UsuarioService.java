package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.TipoAcao;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditoriaService auditoriaService;

    private final String senhaPadrao = "guardiao";

    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Usuario) {
            return (Usuario) principal;
        }
        return null;
    }

    @Transactional
    public Usuario registrarNovoUsuario(RegistroUsuarioDTO registroUsuarioDTO) {
        if (usuarioRepository.findByLogin(registroUsuarioDTO.getLogin()).isPresent()) {
            throw new IllegalStateException("O nome de usuário (login) informado já está em uso." +
                    "Tente entrar no sistema com ele.");
        }
        if (usuarioRepository.findByEmail(registroUsuarioDTO.getEmail()).isPresent()) {
            throw new IllegalStateException("O e-mail informado já está cadastrado.");
        }
        Usuario dadosNovoUsuario = new Usuario();
        dadosNovoUsuario.setNome(registroUsuarioDTO.getNome());
        dadosNovoUsuario.setLogin(registroUsuarioDTO.getLogin());
        dadosNovoUsuario.setEmail(registroUsuarioDTO.getEmail());
        dadosNovoUsuario.setSenha(passwordEncoder.encode(senhaPadrao));
        dadosNovoUsuario.setSenhaExpirada(true);
        dadosNovoUsuario.setPerfil(registroUsuarioDTO.getPerfil());
        dadosNovoUsuario.setStatus(StatusUsuario.ATIVO);
        Usuario novoUsuario = usuarioRepository.save(dadosNovoUsuario);
        auditoriaService.registrar(
                getUsuarioLogado(),
                TipoAcao.CRIACAO_USUARIO,
                "Usuário: " + dadosNovoUsuario.getLogin(),
                "Novo usuário registrado no sistema."
        );
        return novoUsuario;
    }

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

        String dadosAlterados = detectarAlteracoesUsuario(usuario, dados);

        usuario.setNome(dados.getNome());
        usuario.setEmail(dados.getEmail());
        usuario.setPerfil(dados.getPerfil());
        usuario.setStatus(dados.getStatus());
        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        auditoriaService.registrar(
                getUsuarioLogado(),
                TipoAcao.EDICAO_USUARIO,
                "Usuário: " + usuarioAtualizado.getLogin(),
                dadosAlterados
        );
        return usuarioAtualizado;
    }

    @Transactional
    public void excluirUsuario(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        usuario.setStatus(StatusUsuario.EXCLUIDO);
        auditoriaService.registrar(
                getUsuarioLogado(),
                TipoAcao.EXCLUSAO_USUARIO,
                "Usuário: " + usuario.getLogin(),
                "Um usuário foi excluído do sistema."
        );
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void definirNovaSenha(Usuario usuarioLogado, NovaSenhaDTO novaSenhaDTO) {
        usuarioLogado.setSenha(passwordEncoder.encode(novaSenhaDTO.getNovaSenha()));
        usuarioLogado.setSenhaExpirada(false);
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.ALTERACAO_SENHA_USUARIO,
                "Primeiro acesso",
                "Usuário definiu senha de acesso ao sistema."
        );
        usuarioRepository.save(usuarioLogado);
    }

    @Transactional
    public void resetarSenha(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));
        usuario.setSenha(passwordEncoder.encode(senhaPadrao));
        usuario.setSenhaExpirada(true);
        auditoriaService.registrar(
                getUsuarioLogado(),
                TipoAcao.RESET_SENHA_USUARIO,
                "Usuário: " + usuario.getLogin(),
                "Senha do usuário resetada no sistema."
        );
        usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario atualizarPerfil(Usuario usuarioLogado, PerfilUpdateDTO dados) {
        usuarioRepository.findByEmail(dados.getEmail()).ifPresent(u -> {
            if (!u.getId().equals(usuarioLogado.getId())) {
                throw new IllegalStateException("O e-mail informado já está em uso por outro usuário.");
            }
        });
        usuarioLogado.setNome(dados.getNome());
        usuarioLogado.setEmail(dados.getEmail());
        Usuario usuarioAtualizado = usuarioRepository.save(usuarioLogado);
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.ALTERACAO_PERFIL_USUARIO,
                "Usuário: " + usuarioAtualizado.getLogin(),
                "Usuário atualizou seus dados cadastrais no sistema."
        );
        return usuarioAtualizado;
    }

    @Transactional
    public void alterarSenha(Usuario usuarioLogado, SenhaUpdateDTO dados) {
        if (!passwordEncoder.matches(dados.getSenhaAtual(), usuarioLogado.getPassword())) {
            throw new BadCredentialsException("A senha atual está incorreta.");
        }
        usuarioLogado.setSenha(passwordEncoder.encode(dados.getNovaSenha()));
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.ALTERACAO_SENHA_USUARIO,
                "Usuário: " + usuarioLogado.getNome(),
                "Usuário alterou sua própria senha."
        );
        usuarioRepository.save(usuarioLogado);
    }

    public Page<UsuarioDTO> listarUsuariosAtivos(Pageable pageable) {
        Page<Usuario> usuariosPaginados = usuarioRepository.findAllByStatusNot(StatusUsuario.EXCLUIDO, pageable);
        return usuariosPaginados.map(UsuarioDTO::new);
    }

    public Page<UsuarioDTO> listarUsuariosParaDataTable(String termoBusca, Pageable pageable) {
        Specification<Usuario> spec = (root, query, criteriaBuilder) -> {

            var statusPredicate = criteriaBuilder.notEqual(root.get("status"), StatusUsuario.EXCLUIDO);

            if (termoBusca == null || termoBusca.isBlank()) {
                return statusPredicate;
            }

            var nomeLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("nome")), "%" + termoBusca.toLowerCase() + "%");
            var loginLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("login")), "%" + termoBusca.toLowerCase() + "%");
            var emailLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), "%" + termoBusca.toLowerCase() + "%");

            var orPredicate = criteriaBuilder.or(nomeLike, loginLike, emailLike);

            return criteriaBuilder.and(statusPredicate, orPredicate);
        };

        return usuarioRepository.findAll(spec, pageable).map(UsuarioDTO::new);
    }

    /**
     * Metodo auxiliar para detectar alterações de dados cadastrais de usuário
     * para alimentar os logs do serviço de Auditoria do sistema.
     */
    private String detectarAlteracoesUsuario(Usuario dadosAntigosUsuario, UsuarioUpdateDTO dadosNovosUsuario) {
        List<String> mudancas = new ArrayList<>();

        if (!dadosAntigosUsuario.getNome().equals(dadosNovosUsuario.getNome())) {
            mudancas.add("Nome: '" + dadosAntigosUsuario.getNome() + "' -> '" + dadosNovosUsuario.getNome() + "'");
        }

        if (!dadosAntigosUsuario.getPerfil().equals(dadosNovosUsuario.getPerfil())) {
            mudancas.add("Perfil: " + dadosAntigosUsuario.getPerfil().name() + " -> " + dadosNovosUsuario.getPerfil().name());
        }

        if (!dadosAntigosUsuario.getStatus().equals(dadosNovosUsuario.getStatus())) {
            mudancas.add("Status: " + dadosAntigosUsuario.getStatus() + " -> " + dadosNovosUsuario.getStatus());
        }

        return mudancas.isEmpty() ? "Nenhuma alteração detectada." : String.join("; ", mudancas);
    }
}
