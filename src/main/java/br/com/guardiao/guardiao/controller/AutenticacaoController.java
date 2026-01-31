package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.AutenticacaoDTO;
import br.com.guardiao.guardiao.model.TipoAcao;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import br.com.guardiao.guardiao.service.AuditoriaService;
import br.com.guardiao.guardiao.service.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditoriaService auditoriaService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid AutenticacaoDTO autenticacaoDTO) {

        var usernamePassword = new UsernamePasswordAuthenticationToken(autenticacaoDTO.getLogin(), autenticacaoDTO.getSenha());

        try {
            Authentication auth = this.authenticationManager.authenticate(usernamePassword);
            Usuario usuario = (Usuario) auth.getPrincipal();
            String token = tokenService.generateToken(usuario);
            auditoriaService.registrar(
                    usuario,
                    TipoAcao.LOGIN_SUCESSO,
                    "Acesso ao Sistema",
                    "Um acesso foi efetuado no sistema.");
            return ResponseEntity.ok(Map.of("token", token, "trocaSenhaObrigatoria", false));

        } catch (CredentialsExpiredException e) {
            Usuario usuario = usuarioRepository.findByLogin(autenticacaoDTO.getLogin())
                    .orElseThrow(() -> new BadCredentialsException("Usuário não encontrado durante a expiração da credencial."));
            String token = tokenService.generateToken(usuario);
            auditoriaService.registrar(
                    usuario,
                    TipoAcao.LOGIN_SUCESSO,
                    "Acesso ao Sistema. Login: " + autenticacaoDTO.getLogin(),
                    "Uma tentativa de acesso com senha expirada foi efetuada no sistema.");
            return ResponseEntity.ok(Map.of(
                    "message", "A senha expirou e precisa ser alterada.",
                    "token", token,
                    "trocaSenhaObrigatoria", true
            ));

        } catch (DisabledException e) {
            auditoriaService.registrar(
                    null,
                    TipoAcao.LOGIN_FALHA,
                    "Acesso ao Sistema. Login: " + autenticacaoDTO.getLogin(),
                    "Uma tentativa de acesso com uma conta desativada foi efetuada no sistema.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Usuário está inativo. Contate o administrador."));

        } catch (BadCredentialsException e) {
            auditoriaService.registrar(
                    null,
                    TipoAcao.LOGIN_FALHA,
                    "Acesso ao Sistema. Login: " + autenticacaoDTO.getLogin(),
                    "Uma tentativa de acesso com credenciais inválidas foi efetuado no sistema.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Login ou senha inválidos. Tente novamente."));
        }
    }
}
