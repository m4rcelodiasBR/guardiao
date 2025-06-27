package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    @Autowired
    private ItemService itemService;

    /**
     * Endpoint ÚNICO para listar e filtrar itens de forma paginada.
     * O Spring cria automaticamente o objeto 'pageable' a partir de parâmetros
     * na URL como ?page=0&size=10&sort=descricao,asc
     */
    @GetMapping("/filtrar")
    public PageDTO<ItemAtivoDTO> buscarItensAtivos(ItemBuscaDTO itemBuscaDTO, Pageable pageable) {
        return itemService.buscarItensAtivos(itemBuscaDTO, pageable);
    }

    /**
     * Endpoint para buscar os dados de um único item para edição.
     */
    @GetMapping("/{numeroPatrimonial}")
    public Item getItemPorPatrimonio(@PathVariable String numeroPatrimonial) {
        return itemService.buscarPorPatrimonio(numeroPatrimonial);
    }

    /**
     * Endpoint para cadastrar um novo item.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Item adicionarItem(@RequestBody @Valid ItemCadastroDTO itemDTO, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        return itemService.salvarItem(itemDTO, usuarioLogado);
    }

    /**
     * Endpoint para atualizar um item existente.
     */
    @PutMapping("/{numeroPatrimonial}")
    public Item atualizarItem(@PathVariable String numeroPatrimonial,
                              @RequestBody @Valid ItemUpdateDTO dadosAtualizados,
                              Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        return itemService.atualizarItem(numeroPatrimonial, dadosAtualizados, usuarioLogado);
    }

    /**
     * Endpoint para a exclusão lógica de um item.
     */
    @DeleteMapping("/{numeroPatrimonial}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirItem(@PathVariable String numeroPatrimonial, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        itemService.excluirItem(numeroPatrimonial, usuarioLogado);
    }

    /**
     * Endpoint para a exclusão lógica de múltiplos itens.
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirVariosItens(@RequestBody List<String> numerosPatrimoniais, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        itemService.excluirVariosItens(numerosPatrimoniais, usuarioLogado);
    }

    /**
     * Endpoint para registrar a devolução de um item.
     */
    @PostMapping("/devolver")
    public Item devolverItem(@RequestBody @Valid DevolucaoDTO devolucaoDTO, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        return itemService.registrarDevolucao(devolucaoDTO, usuarioLogado);
    }
}