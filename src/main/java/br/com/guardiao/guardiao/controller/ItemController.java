package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public List<Item> listarItens() {
        return itemService.listarItensDisponiveis();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Item adicionarItem(@RequestBody Item item) {
        return itemService.salvarItem(item);
    }

    @DeleteMapping("/{numeroPatrimonial}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarItem(@PathVariable String numeroPatrimonial) {
        itemService.deletarItem(numeroPatrimonial);
    }
}