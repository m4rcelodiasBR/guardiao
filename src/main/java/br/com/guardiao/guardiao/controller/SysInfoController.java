package br.com.guardiao.guardiao.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sistema")
public class SysInfoController {

    @Autowired(required = false)
    private BuildProperties buildProperties;

    @GetMapping("/versao")
    public ResponseEntity<Map<String, String>> getVersao() {
        Map<String, String> sysInfo = new HashMap<>();
        String display;

        if (buildProperties != null) {
            DateTimeFormatter dataFormatada = DateTimeFormatter.ofPattern("yyyy.MM.dd");
            String build = buildProperties.getTime()
                    .atZone(ZoneId.of("America/Sao_Paulo"))
                    .format(dataFormatada);
            display = "Versão da Build: " + build + ".PRD";
            sysInfo.put("raw_date", buildProperties.getTime().toString());
        } else {
            display = "Ambiente DEV";
        }

        sysInfo.put("display", display);

        return ResponseEntity.ok(sysInfo);
    }
}