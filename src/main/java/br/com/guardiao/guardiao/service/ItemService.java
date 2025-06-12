package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    public List<Item> listarItensDisponiveis() {
        return itemRepository.findItensDisponiveis();
    }

    public Item salvarItem(Item item) {
        // Aqui poderíamos adicionar lógicas futuras, como validar se o patrimônio já existe, etc.
        return itemRepository.save(item);
    }

    public void deletarItem(String numeroPatrimonial) {
        // Primeiro, busca o item para garantir que ele existe antes de deletar
        Item item = itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + numeroPatrimonial + " não encontrado."));

        itemRepository.deleteById(item.getId());
    }
}