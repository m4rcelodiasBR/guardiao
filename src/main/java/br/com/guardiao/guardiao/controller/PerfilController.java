package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.NovaSenhaDTO;
import br.com.guardiao.guardiao.controller.dto.PerfilUpdateDTO;
import br.com.guardiao.guardiao.controller.dto.SenhaUpdateDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfil")
public class PerfilController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/meus-dados")
    public ResponseEntity<Usuario> buscarMeusDados(Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        usuarioLogado.setSenha(null);
        return ResponseEntity.ok(usuarioLogado);
    }

    @PutMapping("/meus-dados")
    public ResponseEntity<Usuario> atualizarMeusDados(Authentication authentication, @RequestBody @Valid PerfilUpdateDTO perfilUpdateDTO) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        Usuario usuarioAtualizado = usuarioService.atualizarPerfil(usuarioLogado, perfilUpdateDTO);
        usuarioAtualizado.setSenha(null);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @PutMapping("/alterar-senha")
    public ResponseEntity<Void> alterarMinhaSenha(Authentication authentication, @RequestBody @Valid SenhaUpdateDTO senhaUpdateDTO) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        usuarioService.alterarSenha(usuarioLogado, senhaUpdateDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/definir-nova-senha")
    public ResponseEntity<Void> definirNovaSenha(Authentication authentication, @RequestBody @Valid NovaSenhaDTO novaSenhaDTO) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        usuarioService.definirNovaSenha(usuarioLogado, novaSenhaDTO);
        return ResponseEntity.ok().build();
    }
}
