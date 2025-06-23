package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Item;

public class ItemAtivoDTO {

    private Item item;
    private boolean transferenciaPermanente;

    public ItemAtivoDTO(Item item, boolean transferenciaPermanente) {
        this.item = item;
        this.transferenciaPermanente = transferenciaPermanente;
    }

    public Item getItem() {
        return item;

    }
    public void setItem(Item item) {
        this.item = item;
    }

    public boolean isTransferenciaPermanente() {
        return transferenciaPermanente;
    }

    public void setTransferenciaPermanente(boolean transferenciaPermanente) {
        this.transferenciaPermanente = transferenciaPermanente;
    }
}
    