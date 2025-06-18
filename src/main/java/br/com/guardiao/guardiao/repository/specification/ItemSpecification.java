package br.com.guardiao.guardiao.repository.specification;

import br.com.guardiao.guardiao.controller.dto.ItemBuscaDTO;
import br.com.guardiao.guardiao.model.Item;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class ItemSpecification {

    // Dentro da classe ItemSpecification.java

    public Specification<Item> getSpecifications(ItemBuscaDTO request) {

        Specification<Item> spec = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();

        if (request.getNumeroPatrimonial() != null && !request.getNumeroPatrimonial().isEmpty()) {
            spec = spec.and(hasNumeroPatrimonial(request.getNumeroPatrimonial()));
        }
        if (request.getDescricao() != null && !request.getDescricao().isEmpty()) {
            spec = spec.and(hasDescricao(request.getDescricao()));
        }
        if (request.getNumeroDeSerie() != null && !request.getNumeroDeSerie().isEmpty()) {
            spec = spec.and(hasNumeroDeSerie(request.getNumeroDeSerie()));
        }
        if (request.getCompartimento() != null && !request.getCompartimento().isEmpty()) {
            spec = spec.and(hasCompartimento(request.getCompartimento()));
        }
        if (request.getLocalizacao() != null && !request.getLocalizacao().isEmpty()) {
            spec = spec.and(hasLocalizacao(request.getLocalizacao()));
        }

        return spec;
    }

    private Specification<Item> hasNumeroPatrimonial(String value) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(root.get("numeroPatrimonial")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasDescricao(String value) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(root.get("descricao")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasNumeroDeSerie(String value) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(root.get("numeroDeSerie")), "%" + value.toLowerCase() + "%");
    }

    private Specification<Item> hasCompartimento(String value) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("compartimento").as(String.class), value);
    }

    // Nova função para busca por localização
    private Specification<Item> hasLocalizacao(String value) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(root.get("localizacao")), "%" + value.toLowerCase() + "%");
    }
}