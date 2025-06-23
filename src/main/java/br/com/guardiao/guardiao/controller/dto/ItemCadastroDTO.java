package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Compartimento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ItemCadastroDTO {

    // Regex para validar exatamente 9 dígitos numéricos.
    @Pattern(regexp = "^[0-9]{9}$", message = "O número patrimonial deve conter exatamente 9 dígitos.")
    private String numeroPatrimonial;

    @NotBlank(message = "A descrição não pode ser vazia.")
    @Size(max = 255, message = "A descrição não pode exceder 255 caracteres.")
    private String descricao;

    private String marca;
    private String numeroDeSerie;
    private String localizacao;
    private Compartimento compartimento;

    public String getNumeroPatrimonial() {
        return numeroPatrimonial;
    }

    public void setNumeroPatrimonial(String numeroPatrimonial) {
        this.numeroPatrimonial = numeroPatrimonial;
    }

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
}