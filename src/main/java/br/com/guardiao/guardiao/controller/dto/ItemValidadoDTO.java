package br.com.guardiao.guardiao.controller.dto;

public class ItemValidadoDTO {

    public enum StatusValidacao {
        VALIDO,
        INVALIDO,
        VALIDO_COM_AVISO
    }

    private ItemCadastroDTO item;
    private StatusValidacao status;
    private String mensagem;

    public ItemValidadoDTO() {}

    public ItemValidadoDTO(ItemCadastroDTO item, StatusValidacao status, String mensagem) {
        this.item = item;
        this.status = status;
        this.mensagem = mensagem;
    }

    public ItemCadastroDTO getItem() {
        return item;
    }

    public void setItem(ItemCadastroDTO item) {
        this.item = item;
    }

    public StatusValidacao getStatus() {
        return status;
    }

    public void setStatus(StatusValidacao status) {
        this.status = status;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }
}