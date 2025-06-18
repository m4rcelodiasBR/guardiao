package br.com.guardiao.guardiao.controller.dto;

import java.util.List;

public class TransferenciaMassaDTO {
    private List<String> numerosPatrimoniais;
    private String incumbenciaDestino;
    private String observacao;

    public List<String> getNumerosPatrimoniais() {
        return numerosPatrimoniais;
    }

    public void setNumerosPatrimoniais(List<String> numerosPatrimoniais) {
        this.numerosPatrimoniais = numerosPatrimoniais;
    }

    public String getIncumbenciaDestino() {
        return incumbenciaDestino;
    }

    public void setIncumbenciaDestino(String incumbenciaDestino) {
        this.incumbenciaDestino = incumbenciaDestino;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

}
