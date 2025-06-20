package br.com.guardiao.guardiao.controller.dto;

public class TransferenciaBuscaDTO {

    private String numeroPatrimonialItem;
    private String descricaoItem;
    private String incumbenciaDestino;
    private String nomeUsuario;

    public String getNumeroPatrimonialItem() {
        return numeroPatrimonialItem;
    }

    public void setNumeroPatrimonialItem(String numeroPatrimonialItem) {
        this.numeroPatrimonialItem = numeroPatrimonialItem;
    }

    public String getDescricaoItem() {
        return descricaoItem;
    }

    public void setDescricaoItem(String descricaoItem) {
        this.descricaoItem = descricaoItem;
    }

    public String getIncumbenciaDestino() {
        return incumbenciaDestino;
    }

    public void setIncumbenciaDestino(String incumbenciaDestino) {
        this.incumbenciaDestino = incumbenciaDestino;
    }

    public String getNomeUsuario() {
        return nomeUsuario;
    }

    public void setNomeUsuario(String nomeUsuario) {
        this.nomeUsuario = nomeUsuario;
    }
}
    