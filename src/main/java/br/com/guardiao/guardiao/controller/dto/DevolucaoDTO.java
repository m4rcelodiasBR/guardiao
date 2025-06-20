package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Compartimento;

public class DevolucaoDTO {
    private String numeroPatrimonial;
    private String localizacao;
    private Compartimento compartimento;
    private String observacao;

    public String getNumeroPatrimonial() {
        return numeroPatrimonial;
    }

    public void setNumeroPatrimonial(String numeroPatrimonial) {
        this.numeroPatrimonial = numeroPatrimonial;
    }

    public String getLocalizacao() {
        return localizacao;
    }

    public void setLocalizacao(String localizacao) {
        this.localizacao = localizacao;
    }

    public Compartimento getCompartimento() {
        return compartimento;
    }

    public void setCompartimento(Compartimento compartimento) {
        this.compartimento = compartimento;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }
}
    