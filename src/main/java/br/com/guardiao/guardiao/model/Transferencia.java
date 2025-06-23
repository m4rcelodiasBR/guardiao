package br.com.guardiao.guardiao.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;

@Entity
@Table(name = "transferencias")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Transferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "numero_patrimonial_item")
    private String numeroPatrimonialItem;

    @Column(name = "descricao_item")
    private String descricaoItem;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "incumbencia_destino", nullable = false)
    private String incumbenciaDestino;

    @Column
    private String observacao;

    @CreationTimestamp
    @Column(name = "data_transferencia", updatable = false)
    private OffsetDateTime dataTransferencia;

    public Integer getId() {
        return id;
    }

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

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getIncumbenciaDestino() {
        return incumbenciaDestino;
    }

    public void setIncumbenciaDestino(String incumbenciaDestino) {
        this.incumbenciaDestino = incumbenciaDestino;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public OffsetDateTime getDataTransferencia() {
        return dataTransferencia;
    }

    public void setDataTransferencia(OffsetDateTime dataTransferencia) {
        this.dataTransferencia = dataTransferencia;
    }
}