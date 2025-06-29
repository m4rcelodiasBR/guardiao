package br.com.guardiao.guardiao.model;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum Compartimento {
    CP09("CP09","Sala dos Servidores", "CP09 - Sala dos Servidores"),
    CP14("CP14","Sala Fun Coil", "CP14 - Sala Fun Coil"),
    CP18("CP18","Sala de Computação", "CP18 - Sala de Computação"),
    CP19("CP19","Sala do Encarregado", "CP19 - Sala do Encarregado"),
    CP40("CP40","Sala de Sessões", "CP40 - Sala de Sessões"),
    CP41("CP41","Armário de Sobressalentes CPD", "CP41 - Armário de Sobressalentes"),;

    private final String codigo;
    private final String descricao;
    private final String codigoDescricao;

    Compartimento(String codigo, String descricao, String codigoDescricao) {
        this.descricao = descricao;
        this.codigo = codigo;
        this.codigoDescricao = codigoDescricao;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getCodigoDescricao() {
        return codigoDescricao;
    }
}