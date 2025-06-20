package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.AutenticacaoDTO;
import br.com.guardiao.guardiao.controller.dto.TokenDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<TokenDTO> login(@RequestBody AutenticacaoDTO authDTO) {
        var usernamePassword = new UsernamePasswordAuthenticationToken(authDTO.getEmail(), authDTO.getSenha());
        var auth = this.authenticationManager.authenticate(usernamePassword);
        var token = tokenService.generateToken((Usuario) auth.getPrincipal());
        return ResponseEntity.ok(new TokenDTO(token));
    }
}