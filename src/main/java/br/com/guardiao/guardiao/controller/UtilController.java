package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.model.Incumbencia;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/util")
public class UtilController {

    @GetMapping("/incumbencias")
    public List<Map<String, String>> getIncumbencias() {
        return Arrays.stream(Incumbencia.values())
                .map(i -> Map.of(
                        "codigo", i.name(),
                        "descricao", i.getDescricao()
                ))
                .collect(Collectors.toList());
    }
}