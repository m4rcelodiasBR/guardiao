package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Transferencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransferenciaRepository extends JpaRepository<Transferencia, Integer> {

    /**
     * O Spring Data JPA cria a query automaticamente a partir do nome do metodo!
     * "FindBy" -> Inicia uma busca.
     * "IncumbenciaDestino" -> Pelo atributo incumbenciaDestino.
     * "Containing" -> Usando a lógica do "LIKE" do SQL.
     * "IgnoreCase" -> Ignorando maiúsculas e minúsculas.
     */
    List<Transferencia> findByNumeroPatrimonialItemContainingIgnoreCase(String numeroPatrimonial);

}