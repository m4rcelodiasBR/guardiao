package br.com.guardiao.guardiao.controller.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;

import java.util.ArrayList;
import java.util.List;

public class ItemImportacaoDTO {
    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "column")
    private List<String> colunas = new ArrayList<>();

    public List<String> getColunas() {
        return colunas;
    }
}
