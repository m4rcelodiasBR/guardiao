package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Compartimento;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping("/ativos")
    public List<ItemAtivoDTO> listarItensAtivos(ItemBuscaDTO itemBuscaDTO) {
        return itemService.buscarItensAtivos(itemBuscaDTO);
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
    public Item adicionarItem(@RequestBody @Valid ItemCadastroDTO itemCadastroDTO, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        return itemService.salvarItem(itemCadastroDTO, usuarioLogado);
    }

    @PostMapping("/devolver")
    public Item devolverItem(@RequestBody DevolucaoDTO devolucaoDTO) {
        return itemService.registrarDevolucao(devolucaoDTO);
    }

    @PutMapping("/{numeroPatrimonial}")
    public Item atualizarItem(@PathVariable String numeroPatrimonial,
                              @RequestBody @Valid ItemUpdateDTO itemUpdateDTO,
                              Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        return itemService.atualizarItem(numeroPatrimonial, itemUpdateDTO, usuarioLogado);
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