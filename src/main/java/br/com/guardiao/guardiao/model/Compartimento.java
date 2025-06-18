package br.com.guardiao.guardiao.model;

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