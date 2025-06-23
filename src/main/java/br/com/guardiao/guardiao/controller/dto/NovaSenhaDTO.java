package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.validation.StrongPassword;

public class NovaSenhaDTO {

    @StrongPassword
    private String novaSenha;

    public String getNovaSenha() {
        return novaSenha;
    }

    public void setNovaSenha(String novaSenha) {
        this.novaSenha = novaSenha;
    }
}
