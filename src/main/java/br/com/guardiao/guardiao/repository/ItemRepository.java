    package br.com.guardiao.guardiao.repository;

    import br.com.guardiao.guardiao.model.Item;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
    import org.springframework.data.jpa.repository.Query;
    import org.springframework.stereotype.Repository;

    import java.util.List;
    import java.util.Optional;

    @Repository
    public interface ItemRepository extends JpaRepository<Item, Integer>, JpaSpecificationExecutor<Item> {

        @Query("SELECT i FROM Item i WHERE i.id NOT IN (SELECT t.item.id FROM Transferencia t)") List<Item> findItensDisponiveis();

        Optional<Item> findByNumeroPatrimonial(String numeroPatrimonial);

        Optional<Item> findByNumeroDeSerieAndIdNot(String numeroDeSerie, Integer id);
    }