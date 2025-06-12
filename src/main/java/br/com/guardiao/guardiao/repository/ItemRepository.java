// em br.com.guardiao.guardiao.repository.ItemRepository.java
package br.com.guardiao.guardiao.repository;

import br.com.guardiao.guardiao.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // Importe o Query
import org.springframework.stereotype.Repository;
import java.util.List; // Importe o List
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {

    /**
     * Busca todos os itens que NÃO estão presentes em NENHUMA transferência.
     * Isso efetivamente nos dá a lista de itens "disponíveis" ou "em estoque".
     * A linguagem aqui é JPQL (Java Persistence Query Language), similar ao SQL.
     */
    @Query("SELECT i FROM Item i WHERE i.id NOT IN (" +
            "SELECT t.item.id FROM Transferencia t)")
    List<Item> findItensDisponiveis();

    Optional<Item> findByNumeroPatrimonial(String numeroPatrimonial);

}