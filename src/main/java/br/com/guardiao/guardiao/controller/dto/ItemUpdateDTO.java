package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Compartimento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ItemUpdateDTO {

    @NotBlank(message = "A descrição não pode ser vazia.")
    @Size(max = 255, message = "A descrição não pode exceder 255 caracteres.")
    private String descricao;

    @Size(max = 100, message = "A marca não pode exceder 100 caracteres.")
    private String marca;

    @Size(max = 100, message = "O número de série não pode exceder 100 caracteres.")
    private String numeroDeSerie;

    @Size(max = 150, message = "A localização não pode exceder 150 caracteres.")
    private String localizacao;

    private boolean avariado;

    private Compartimento compartimento;

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getNumeroDeSerie() {
        return numeroDeSerie;
    }

    public void setNumeroDeSerie(String numeroDeSerie) {
        this.numeroDeSerie = numeroDeSerie;
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

    public boolean isAvariado() {
        return avariado;
    }

    public void setAvariado(boolean avariado) {
        this.avariado = avariado;
    }
}