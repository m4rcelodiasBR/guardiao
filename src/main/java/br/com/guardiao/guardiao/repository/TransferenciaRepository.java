package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Transferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Integer>, JpaSpecificationExecutor<Transferencia> {

    Optional<Transferencia> findTopByItemIdOrderByIdDesc(Integer itemId);

    @Query("SELECT t FROM Transferencia t WHERE t.id IN " +
            "(SELECT MAX(t2.id) FROM Transferencia t2 WHERE t2.item.id IN :itemIds GROUP BY t2.item.id)")
        List<Transferencia> findLatestTransferenciaForItens(@Param("itemIds") List<Integer> itemIds);
}