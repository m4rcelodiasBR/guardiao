package br.com.guardiao.guardiao.model;

public enum Incumbencia {
    INCUMBENCIA_100("100 - Incumbência 1"),
    INCUMBENCIA_200("200 - Incumbência 2"),
    INCUMBENCIA_300("300 - Incumbência 3"),
    INCUMBENCIA_400("400 - Incumbência 4"),
    INCUMBENCIA_500("500 - Incumbência 5"),
    INCUMBENCIA_600("600 - Incumbência 6"),
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
    