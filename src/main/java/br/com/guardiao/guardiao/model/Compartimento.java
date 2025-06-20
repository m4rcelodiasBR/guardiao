package br.com.guardiao.guardiao.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Compartimento {
    CP09("CP09 - Sala de Sessões"),
    CP14("CP14 - Sala Fun Coil"),
    CP18("CP18 - Sala de Computação"),
    CP19("CP19 - Sala do Encarregado"),
    CP40("CP40 - Sala de Servidores"),
    CP41("CP41 - Armário de Sobressalentes");

    private final String descricao;

    Compartimento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}