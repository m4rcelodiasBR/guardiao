package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public class SenhaUpdateDTO {

    @NotBlank(message = "A senha atual é obrigatória.")
    private String senhaAtual;

    @StrongPassword
    private String novaSenha;

    public String getSenhaAtual() {
        return senhaAtual;
    }

    public void setSenhaAtual(String senhaAtual) {
        this.senhaAtual = senhaAtual;
    }

    public String getNovaSenha() {
        return novaSenha;
    }

    public void setNovaSenha(String novaSenha) {
        this.novaSenha = novaSenha;
    }
}
    