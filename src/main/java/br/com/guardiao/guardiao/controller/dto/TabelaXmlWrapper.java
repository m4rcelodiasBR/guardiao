package br.com.guardiao.guardiao.controller.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import java.util.List;

public class TabelaXmlWrapper {

    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "row")
    private List<ItemImportacaoDTO> rows;

    public List<ItemImportacaoDTO> getRows() {
        return rows;
    }

    public void setRows(List<ItemImportacaoDTO> rows) {
        this.rows = rows;
    }
}
