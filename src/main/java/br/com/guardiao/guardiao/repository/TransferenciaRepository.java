package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Transferencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Integer>, JpaSpecificationExecutor<Transferencia> {

}