package br.com.guardiao.guardiao.repository.specification;

import br.com.guardiao.guardiao.controller.dto.TransferenciaBuscaDTO;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TransferenciaSpecification {

    public Specification<Transferencia> getSpecifications(TransferenciaBuscaDTO request) {
        Specification<Transferencia> spec = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (request.getNumeroPatrimonialItem() != null && !request.getNumeroPatrimonialItem().isEmpty()) {
            spec = spec.and(hasNumeroPatrimonial(request.getNumeroPatrimonialItem()));
        }
        if (request.getDescricaoItem() != null && !request.getDescricaoItem().isEmpty()) {
            spec = spec.and(hasDescricao(request.getDescricaoItem()));
        }
        if (request.getIncumbenciaDestino() != null && !request.getIncumbenciaDestino().isEmpty()) {
            spec = spec.and(hasIncumbenciaDestino(request.getIncumbenciaDestino()));
        }
        if (request.getNomeUsuario() != null && !request.getNomeUsuario().isEmpty()) {
            spec = spec.and(hasUsuarioNome(request.getNomeUsuario()));
        }

        return spec;
    }

    private Specification<Transferencia> hasNumeroPatrimonial(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("numeroPatrimonialItem")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Transferencia> hasDescricao(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("descricaoItem")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Transferencia> hasIncumbenciaDestino(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("incumbenciaDestino")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Transferencia> hasUsuarioNome(String value) {
        return (root, query, cb) -> {
            Join<Transferencia, Usuario> usuarioJoin = root.join("usuario");
            return cb.like(cb.lower(usuarioJoin.get("nome")), "%" + value.toLowerCase() + "%");
        };
    }
}
    