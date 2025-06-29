package br.com.guardiao.guardiao.controller.dto;

import br.com.guardiao.guardiao.model.Perfil;
import br.com.guardiao.guardiao.model.StatusUsuario;
import br.com.guardiao.guardiao.model.Usuario;

public class UsuarioDTO {

    private Integer id;
    private String nome;
    private String login;
    private String email;
    private Perfil perfil;
    private StatusUsuario status;

    public UsuarioDTO(Usuario usuario) {
        this.id = usuario.getId();
        this.nome = usuario.getNome();
        this.login = usuario.getLogin();
        this.email = usuario.getEmail();
        this.perfil = usuario.getPerfil();
        this.status = usuario.getStatus();
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getLogin() {
        return login;
    }

    public String getEmail() {
        return email;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public StatusUsuario getStatus() {
        return status;
    }
}
