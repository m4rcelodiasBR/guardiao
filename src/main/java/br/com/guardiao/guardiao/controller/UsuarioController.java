package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.DataTablesResponseDTO;
import br.com.guardiao.guardiao.controller.dto.RegistroUsuarioDTO;
import br.com.guardiao.guardiao.controller.dto.UsuarioDTO;
import br.com.guardiao.guardiao.controller.dto.UsuarioUpdateDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

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

    @GetMapping("/visiveis")
    public ResponseEntity<Page<UsuarioDTO>> listarUsuariosVisiveis(Pageable pageable) {
        Page<UsuarioDTO> paginaDeUsuarios = usuarioService.listarUsuariosAtivos(pageable);
        return ResponseEntity.ok(paginaDeUsuarios);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizarUsuario(@PathVariable Integer id, @RequestBody @Valid UsuarioUpdateDTO dados) {
        Usuario usuarioAtualizado = usuarioService.atualizarUsuario(id, dados);
        usuarioAtualizado.setSenha(null);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirUsuario(@PathVariable Integer id) {
        usuarioService.excluirUsuario(id);
    }

    @PostMapping("/{id}/reset-senha")
    public ResponseEntity<Void> resetarSenha(@PathVariable Integer id) {
        usuarioService.resetarSenha(id);
        return ResponseEntity.ok().build();
    }

    // br/com/guardiao/guardiao/controller/UsuarioController.java

    @PostMapping("/datatable")
    public ResponseEntity<DataTablesResponseDTO<UsuarioDTO>> listarUsuariosParaDataTable(
            @RequestParam("draw") int draw,
            @RequestParam("start") int start,
            @RequestParam("length") int length,
            @RequestParam("search[value]") String searchValue,
            @RequestParam(name = "order[0][column]", required = false, defaultValue = "1") int orderColumnIndex,
            @RequestParam(name = "order[0][dir]", required = false, defaultValue = "asc") String orderDirection) {

        List<String> columnNames = List.of("login", "nome", "email", "perfil", "status");

        String orderColumnName = columnNames.get(orderColumnIndex);
        Sort sort = Sort.by(Sort.Direction.fromString(orderDirection), orderColumnName);
        Pageable pageable = PageRequest.of(start / length, length, sort);

        Page<UsuarioDTO> paginaDeUsuarios = usuarioService.listarUsuariosParaDataTable(searchValue, pageable);

        var responseDTO = new DataTablesResponseDTO<UsuarioDTO>();
        responseDTO.setDraw(draw);
        responseDTO.setRecordsTotal(paginaDeUsuarios.getTotalElements());
        responseDTO.setRecordsFiltered(paginaDeUsuarios.getTotalElements());
        responseDTO.setData(paginaDeUsuarios.getContent());

        return ResponseEntity.ok(responseDTO);
    }
}
