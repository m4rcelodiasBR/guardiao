package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.ItemBuscaDTO;
import br.com.guardiao.guardiao.controller.dto.ItemUpdateDTO;
import br.com.guardiao.guardiao.model.Compartimento;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    public List<Item> listarItens(ItemBuscaDTO itemBuscaDTO) {
        return itemService.buscarItensDisponiveis(itemBuscaDTO);
    }

    @GetMapping("/compartimentos")
    public List<Map<String, String>> getCompartimentos() {
        return Arrays.stream(Compartimento.values())
                .map(c -> Map.of(
                        "name", c.name(),
                        "descricao", c.getDescricao()
                ))
                .collect(Collectors.toList());
    }

    @GetMapping("/{numeroPatrimonial}")
    public Item getItemPorPatrimonio(@PathVariable String numeroPatrimonial) {
        return itemService.buscarPorPatrimonio(numeroPatrimonial);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Item adicionarItem(@RequestBody Item item) {
        return itemService.salvarItem(item);
    }

    @PutMapping("/{numeroPatrimonial}")
    public Item atualizarItem(@PathVariable String numeroPatrimonial, @RequestBody ItemUpdateDTO dadosAtualizados) {
        return itemService.atualizarItem(numeroPatrimonial, dadosAtualizados);
    }

    @DeleteMapping("/{numeroPatrimonial}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarItem(@PathVariable String numeroPatrimonial) {
        itemService.deletarItem(numeroPatrimonial);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletarVariosItens(@RequestBody List<String> numerosPatrimoniais) {
        itemService.deletarVariosItens(numerosPatrimoniais);
    }

}