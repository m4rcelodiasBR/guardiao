package br.com.guardiao.guardiao.repository.specification;

import br.com.guardiao.guardiao.controller.dto.ItemBuscaDTO;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.StatusItem;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class ItemSpecification {

    public Specification<Item> getSpecifications(ItemBuscaDTO itemBuscaDTO) {
        Specification<Item> spec = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (itemBuscaDTO.getNumeroPatrimonial() != null && !itemBuscaDTO.getNumeroPatrimonial().isEmpty()) {
            spec = spec.and(hasNumeroPatrimonial(itemBuscaDTO.getNumeroPatrimonial()));
        }
        if (itemBuscaDTO.getDescricao() != null && !itemBuscaDTO.getDescricao().isEmpty()) {
            spec = spec.and(hasDescricao(itemBuscaDTO.getDescricao()));
        }
        if (itemBuscaDTO.getNumeroDeSerie() != null && !itemBuscaDTO.getNumeroDeSerie().isEmpty()) {
            spec = spec.and(hasNumeroDeSerie(itemBuscaDTO.getNumeroDeSerie()));
        }
        if (itemBuscaDTO.getCompartimento() != null && !itemBuscaDTO.getCompartimento().isEmpty()) {
            spec = spec.and(hasCompartimento(itemBuscaDTO.getCompartimento()));
        }
        if (itemBuscaDTO.getLocalizacao() != null && !itemBuscaDTO.getLocalizacao().isEmpty()) {
            spec = spec.and(hasLocalizacao(itemBuscaDTO.getLocalizacao()));
        }
        if (itemBuscaDTO.getStatus() != null && !itemBuscaDTO.getStatus().isEmpty()) {
            spec = spec.and(hasStatus(itemBuscaDTO.getStatus()));
        }

        return spec;
    }

    private Specification<Item> hasNumeroPatrimonial(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("numeroPatrimonial")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasDescricao(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("descricao")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasNumeroDeSerie(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("numeroDeSerie")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasCompartimento(String value) {
        return (root, query, cb) -> cb.equal(root.get("compartimento").as(String.class), value);
    }

    private Specification<Item> hasLocalizacao(String value) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("localizacao")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasStatus(String statusString) {
        if ("AVARIADO".equalsIgnoreCase(statusString)) {
            return (root, query, cb) -> cb.isTrue(root.get("avariado"));
        }
        try {
            StatusItem status = StatusItem.valueOf(statusString.toUpperCase());
            return (root, query, cb) -> cb.equal(root.get("status"), status);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public Specification<Item> hasGlobalSearch(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String searchTerm = "%" + value.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("numeroPatrimonial")), searchTerm),
                cb.like(cb.lower(root.get("descricao")), searchTerm),
                cb.like(cb.lower(root.get("marca")), searchTerm),
                cb.like(cb.lower(root.get("numeroDeSerie")), searchTerm)
        );
    }
}
