package br.com.guardiao.guardiao.model;

public enum Incumbencia {
    INCUMBENCIA_100("100 - Secretário da CPO"),
    INCUMBENCIA_200("200 - Secretário-Adjunto"),
    INCUMBENCIA_212("212 - Subsecretaria de Seleção"),
    INCUMBENCIA_231("231 - Mestre da CPO"),
    INCUMBENCIA_232("232 - Paiol de Material"),
    INCUMBENCIA_233("233 - Departamento de Administração"),
    INCUMBENCIA_234("234 - Mestre D'Armas"),
    BAIXA("000 - Baixa"),
    DOACAO("001 - Doação"),
    OUTRA_OM("002 - Outra OM");

    private final String descricao;

    Incumbencia(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}