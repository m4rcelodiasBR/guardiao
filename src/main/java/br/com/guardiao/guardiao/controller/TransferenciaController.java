package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.service.TransferenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/datatable")
    public ResponseEntity<DataTablesResponseDTO<TransferenciaDetalheDTO>> listarParaDataTable(
            @RequestBody TransferenciaBuscaDTO buscaDTO,
            @RequestParam("draw") int draw,
            @RequestParam("start") int start,
            @RequestParam("length") int length,
            @RequestParam(name = "order[0][column]", required = false, defaultValue = "0") int orderColumnIndex,
            @RequestParam(name = "order[0][dir]", required = false, defaultValue = "desc") String orderDirection) {

        List<String> columnNames = List.of(
                "dataTransferencia", "numeroPatrimonialItem", "descricaoItem",
                "incumbenciaDestino", "observacao", "usuario"
        );

        Sort sort = Sort.unsorted();
        if (orderColumnIndex >= 0 && orderColumnIndex < columnNames.size()) {
            String columnName = columnNames.get(orderColumnIndex);

            if (columnName.equals("usuario")) {
                columnName = "usuario.nome";
            }
            sort = Sort.by(Sort.Direction.fromString(orderDirection), columnName);
        }

        Pageable pageable = PageRequest.of(start / length, length, sort);

        Page<TransferenciaDetalheDTO> paginaDeTransferencias = transferenciaService.listarTransferenciasParaDataTable(buscaDTO, pageable);

        var responseDTO = new DataTablesResponseDTO<TransferenciaDetalheDTO>();
        responseDTO.setDraw(draw);
        responseDTO.setRecordsTotal(paginaDeTransferencias.getTotalElements());
        responseDTO.setRecordsFiltered(paginaDeTransferencias.getTotalElements());
        responseDTO.setData(paginaDeTransferencias.getContent());

        return ResponseEntity.ok(responseDTO);
    }
}