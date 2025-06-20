package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.TransferenciaBuscaDTO;
import br.com.guardiao.guardiao.controller.dto.TransferenciaDTO;
import br.com.guardiao.guardiao.controller.dto.TransferenciaMassaDTO;
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

    @PostMapping("/massa")
    @ResponseStatus(HttpStatus.CREATED)
    public void criarTransferenciaEmMassa(@RequestBody TransferenciaMassaDTO request) {
        transferenciaService.registrarTransferenciaEmMassa(request);
    }

    @GetMapping
    public List<Transferencia> listarOuBuscarHistorico(TransferenciaBuscaDTO transferenciaBuscaDTO) {
        return transferenciaService.buscarTransferencias(transferenciaBuscaDTO);
    }
}