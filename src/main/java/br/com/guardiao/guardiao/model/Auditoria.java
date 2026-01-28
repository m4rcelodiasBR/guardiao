package br.com.guardiao.guardiao.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false)
    private Integer usuarioId;

    @Column(nullable = false)
    private String usuarioNome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoAcao tipoAcao;

    @Column(name = "objeto_afetado")
    private String objetoAfetado;

    @Column(columnDefinition = "TEXT")
    private String detalhe;


    public Auditoria() {}

    public Auditoria(Usuario usuario, TipoAcao tipoAcao, String objetoAfetado, String detalhe) {
        if (usuario != null) {
            this.usuarioId = usuario.getId();
            this.usuarioNome = usuario.getNome();
        } else {
            this.usuarioId = 0;
            this.usuarioNome = "-";
        }
        this.tipoAcao = tipoAcao;
        this.objetoAfetado = objetoAfetado;
        this.detalhe = detalhe;
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public Integer getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public TipoAcao getTipoAcao() {
        return tipoAcao;
    }

    public String getObjetoAfetado() {
        return objetoAfetado;
    }

    public String getDetalhe() {
        return detalhe;
    }
}
