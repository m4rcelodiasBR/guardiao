package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Compartimento;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ItemEdicaoMassaDTO {

    @NotEmpty(message = "É necessário selecionar pelo menos um item.")
    private List<String> numerosPatrimoniais;

    @Size(max = 150, message = "A localização não pode exceder 150 caracteres.")
    private String localizacao;

    private Compartimento compartimento;

    public List<String> getNumerosPatrimoniais() {
        return numerosPatrimoniais;
    }

    public void setNumerosPatrimoniais(List<String> numerosPatrimoniais) {
        this.numerosPatrimoniais = numerosPatrimoniais;
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
}