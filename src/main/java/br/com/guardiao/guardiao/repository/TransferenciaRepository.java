package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Transferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Integer>, JpaSpecificationExecutor<Transferencia> {
    Optional<Transferencia> findTopByItemIdOrderByIdDesc(Integer itemId);
}