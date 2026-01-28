package br.com.guardiao.guardiao.repository.specification;

import br.com.guardiao.guardiao.model.Auditoria;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuditoriaSpecification {

    public Specification<Auditoria> hasGlobalSearch(String searchValue) {
        return (root, query, cb) -> {
            if (!StringUtils.hasText(searchValue)) {
                return null;
            }
            String likePattern = "%" + searchValue.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("usuarioNome")), likePattern),
                    cb.like(cb.lower(root.get("objetoAfetado")), likePattern),
                    cb.like(cb.lower(root.get("detalhe")), likePattern),
                    cb.like(cb.lower(root.get("tipoAcao").as(String.class)), likePattern)
            );
        };
    }
}