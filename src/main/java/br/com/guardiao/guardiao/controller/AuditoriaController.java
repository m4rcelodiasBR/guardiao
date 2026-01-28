package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.DataTablesResponseDTO;
import br.com.guardiao.guardiao.model.Auditoria;
import br.com.guardiao.guardiao.repository.AuditoriaRepository;
import br.com.guardiao.guardiao.repository.specification.AuditoriaSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Autowired
    private AuditoriaSpecification auditoriaSpecification;

    @PostMapping("/datatable")
    public ResponseEntity<DataTablesResponseDTO<Auditoria>> listarAuditoria(
            @RequestParam("draw") int draw,
            @RequestParam("start") int start,
            @RequestParam("length") int length,
            @RequestParam("search[value]") String globalSearchValue) {

        Pageable pageable = PageRequest.of(start / length, length, Sort.by("id").descending());

        Specification<Auditoria> spec = auditoriaSpecification.hasGlobalSearch(globalSearchValue);

        Page<Auditoria> pagina = auditoriaRepository.findAll(spec, pageable);

        var response = new DataTablesResponseDTO<Auditoria>();
        response.setDraw(draw);
        response.setRecordsTotal(pagina.getTotalElements());
        response.setRecordsFiltered(pagina.getTotalElements());
        response.setData(pagina.getContent());
        return ResponseEntity.ok(response);
    }
}