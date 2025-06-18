package br.com.guardiao.guardiao.controller.dto;

public class TransferenciaDTO {

    private String numeroPatrimonial;
    private String incumbenciaDestino;
    private String observacao;

    public String getNumeroPatrimonial() {
        return numeroPatrimonial;
    }

    public void setNumeroPatrimonial(String numeroPatrimonial) {
        this.numeroPatrimonial = numeroPatrimonial;
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