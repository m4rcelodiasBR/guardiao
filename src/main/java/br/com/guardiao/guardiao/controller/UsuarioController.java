package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.RegistroUsuarioDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<Usuario> cadastrarUsuario(@RequestBody @Valid RegistroUsuarioDTO registroDTO) {
        Usuario novoUsuario = usuarioService.registrarNovoUsuario(registroDTO);
        return new ResponseEntity<>(novoUsuario, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        List<Usuario> usuarios = usuarioService.listarTodos();
        return ResponseEntity.ok(usuarios);
    }
}
