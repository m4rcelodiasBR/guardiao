package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Perfil;
import br.com.guardiao.guardiao.model.StatusUsuario;

public class UsuarioUpdateDTO {
    private String nome;
    private String email;
    private Perfil perfil;
    private StatusUsuario status;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public void setPerfil(Perfil perfil) {
        this.perfil = perfil;
    }

    public StatusUsuario getStatus() {
        return status;
    }

    public void setStatus(StatusUsuario status) {
        this.status = status;
    }
}