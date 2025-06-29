package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Transferencia;

public class TransferenciaDetalheDTO {

    private Transferencia transferencia;
    private boolean podeSerDevolvido;

    public TransferenciaDetalheDTO(Transferencia transferencia, boolean podeSerDevolvido) {
        this.transferencia = transferencia;
        this.podeSerDevolvido = podeSerDevolvido;
    }

    public Transferencia getTransferencia() {
        return transferencia;
    }

    public void setTransferencia(Transferencia transferencia) {
        this.transferencia = transferencia;
    }

    public boolean isPodeSerDevolvido() {
        return podeSerDevolvido;
    }

    public void setPodeSerDevolvido(boolean podeSerDevolvido) {
        this.podeSerDevolvido = podeSerDevolvido;
    }
}
