package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.dto.TransferenciaDTO;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.service.TransferenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transferencias")
public class TransferenciaController {

    @Autowired
    private TransferenciaService transferenciaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Transferencia criarTransferencia(@RequestBody TransferenciaDTO transferenciaDTO) {
        return transferenciaService.registrarTransferencia(transferenciaDTO);
    }

    @GetMapping
    public List<Transferencia> listarHistorico() {
        return transferenciaService.listarTodasTransferencias();
    }

    @GetMapping("/busca")
    public List<Transferencia> buscarTransferencias(@RequestParam String numeroPatrimonial) {
        return transferenciaService.buscarPorNumeroPatrimonial(numeroPatrimonial);
    }
}