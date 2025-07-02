package br.com.guardiao.guardiao.controller.dto;

public class ItemValidadoDTO {

    // Usamos o ItemCadastroDTO que já temos, pois ele representa um item a ser criado.
    // Isso nos permite reutilizar a lógica de validação que já existe nele.
    private ItemCadastroDTO item;
    private boolean valido;
    private String mensagemErro;

    // Construtor para itens válidos
    public ItemValidadoDTO(ItemCadastroDTO item) {
        this.item = item;
        this.valido = true;
        this.mensagemErro = "OK para importar";
    }

    // Construtor para itens inválidos
    public ItemValidadoDTO(ItemCadastroDTO item, String mensagemErro) {
        this.item = item;
        this.valido = false;
        this.mensagemErro = mensagemErro;
    }

    public ItemCadastroDTO getItem() {
        return item;
    }

    public void setItem(ItemCadastroDTO item) {
        this.item = item;
    }

    public boolean isValido() {
        return valido;
    }

    public void setValido(boolean valido) {
        this.valido = valido;
    }

    public String getMensagemErro() {
        return mensagemErro;
    }

    public void setMensagemErro(String mensagemErro) {
        this.mensagemErro = mensagemErro;
    }
}
