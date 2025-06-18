package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.ItemBuscaDTO;
import br.com.guardiao.guardiao.controller.dto.ItemUpdateDTO;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.specification.ItemSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemSpecification itemSpecification;

    @Autowired
    private TransferenciaRepository transferenciaRepository;

    public Item buscarPorPatrimonio(String numeroPatrimonial) {
        return itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + numeroPatrimonial + " não encontrado."));
    }

    public List<Item> listarItensDisponiveis() {
        return itemRepository.findItensDisponiveis();
    }

    public Item salvarItem(Item item) {
        // Aqui poderíamos adicionar lógicas futuras, como validar se o patrimônio já existe, etc.
        return itemRepository.save(item);
    }

    public void deletarItem(String numeroPatrimonial) {
        Item item = itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + numeroPatrimonial + " não encontrado."));

        itemRepository.deleteById(item.getId());
    }

    @Transactional
    public void deletarVariosItens(List<String> numerosPatrimoniais) {
        if (numerosPatrimoniais == null || numerosPatrimoniais.isEmpty()) {
            return;
        }
        List<Item> itensParaDeletar = numerosPatrimoniais.stream()
                .map(patrimonio -> itemRepository.findByNumeroPatrimonial(patrimonio)
                        .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + patrimonio + " não encontrado.")))
                .collect(Collectors.toList());

        itemRepository.deleteAll(itensParaDeletar);
    }

    public List<Item> buscarItensDisponiveis(ItemBuscaDTO itemBuscaDTO) {

        Specification<Item> spec = itemSpecification.getSpecifications(itemBuscaDTO);

        List<Item> itensFiltrados = itemRepository.findAll(spec);

        // Em seguida, filtra APENAS os que estão disponíveis (não transferidos)
        // Isso é feito em memória para simplificar, mas poderia ser uma subquery na especificação.
        List<Integer> idsTransferidos = transferenciaRepository.findAll().stream()
                .map(t -> t.getItem().getId())
                .toList();

        return itensFiltrados.stream()
                .filter(item -> !idsTransferidos.contains(item.getId()))
                .collect(Collectors.toList());
    }
    // Dentro da classe ItemService

    @Transactional
    public Item atualizarItem(String numeroPatrimonial, ItemUpdateDTO dadosAtualizados) {

        Item itemExistente = buscarPorPatrimonio(numeroPatrimonial);

        itemExistente.setDescricao(dadosAtualizados.getDescricao());
        itemExistente.setMarca(dadosAtualizados.getMarca());
        itemExistente.setNumeroDeSerie(dadosAtualizados.getNumeroDeSerie());
        itemExistente.setLocalizacao(dadosAtualizados.getLocalizacao());
        itemExistente.setCompartimento(dadosAtualizados.getCompartimento());

        return itemRepository.save(itemExistente);
    }
}