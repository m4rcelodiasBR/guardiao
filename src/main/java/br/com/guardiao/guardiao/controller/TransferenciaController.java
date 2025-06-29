package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.service.TransferenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
    public PageDTO<TransferenciaDetalheDTO> listarOuBuscarHistorico(TransferenciaBuscaDTO transferenciaBuscaDTO, Pageable pageable) {
        return transferenciaService.buscarTransferencias(transferenciaBuscaDTO, pageable);
    }
}