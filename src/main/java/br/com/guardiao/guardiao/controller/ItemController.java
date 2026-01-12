package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
     * Endpoint para atualizar vários itens.
     */
    @PutMapping("/massa")
    @ResponseStatus(HttpStatus.OK)
    public void atualizarVariosItens(@RequestBody @Valid ItemEdicaoMassaDTO itemEdicaoMassaDTO, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        itemService.atualizarVariosItens(itemEdicaoMassaDTO, usuarioLogado);
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

    /**
     * Endpoint montar a tabela de itens do inventário com DataTables.
     */
    @PostMapping("/datatable")
    public ResponseEntity<DataTablesResponseDTO<ItemAtivoDTO>> listarItensParaDataTable(
            @RequestBody ItemBuscaDTO itemBuscaDTO, // Recebe os filtros avançados no corpo da requisição
            @RequestParam("draw") int draw,
            @RequestParam("start") int start,
            @RequestParam("length") int length,
            @RequestParam("search[value]") String globalSearchValue,
            @RequestParam(name = "order[0][column]", required = false, defaultValue = "2") int orderColumnIndex,
            @RequestParam(name = "order[0][dir]", required = false, defaultValue = "asc") String orderDirection) {

        List<String> columnNames = List.of(
                "checkbox", "status", "numeroPatrimonial", "descricao",
                "marca", "numeroDeSerie", "localizacao", "compartimento", "acoes"
        );

        Sort sort = Sort.unsorted();
        if (orderColumnIndex >= 0 && orderColumnIndex < columnNames.size()) {
            String columnName = columnNames.get(orderColumnIndex);
            if (!columnName.equals("checkbox") && !columnName.equals("acoes")) {
                sort = Sort.by(Sort.Direction.fromString(orderDirection), columnName);
            }
        }

        Pageable pageable = PageRequest.of(start / length, length, sort);

        Page<ItemAtivoDTO> paginaDeItens = itemService.buscarItensParaDataTable(itemBuscaDTO, globalSearchValue, pageable);

        var responseDTO = new DataTablesResponseDTO<ItemAtivoDTO>();
        responseDTO.setDraw(draw);
        responseDTO.setRecordsTotal(paginaDeItens.getTotalElements());
        responseDTO.setRecordsFiltered(paginaDeItens.getTotalElements());
        responseDTO.setData(paginaDeItens.getContent());

        return ResponseEntity.ok(responseDTO);
    }

    /**
     * Endpoint para montar a tabela de itens excluídos do inventario com DataTables.
     */
    @PostMapping("/excluidos/datatable")
    public ResponseEntity<DataTablesResponseDTO<ItemAtivoDTO>> listarItensExcluidos(
            @RequestBody ItemBuscaDTO itemBuscaDTO,
            @RequestParam("draw") int draw,
            @RequestParam("start") int start,
            @RequestParam("length") int length,
            @RequestParam("search[value]") String globalSearchValue,
            @RequestParam(name = "order[0][column]", required = false, defaultValue = "2") int orderColumnIndex,
            @RequestParam(name = "order[0][dir]", required = false, defaultValue = "asc") String orderDirection) {

        List<String> columnNames = List.of(
                "checkbox", "status", "numeroPatrimonial", "descricao",
                "marca", "numeroDeSerie", "localizacao", "compartimento", "acoes"
        );

        Sort sort = Sort.unsorted();
        if (orderColumnIndex >= 0 && orderColumnIndex < columnNames.size()) {
            String columnName = columnNames.get(orderColumnIndex);
            if (!columnName.equals("checkbox") && !columnName.equals("acoes")) {
                sort = Sort.by(Sort.Direction.fromString(orderDirection), columnName);
            }
        }

        Pageable pageable = PageRequest.of(start / length, length, sort);
        Page<ItemAtivoDTO> paginaDeItens = itemService.buscarItensExcluidosParaDataTable(itemBuscaDTO, globalSearchValue, pageable);
        var responseDTO = new DataTablesResponseDTO<ItemAtivoDTO>();
        responseDTO.setDraw(draw);
        responseDTO.setRecordsTotal(paginaDeItens.getTotalElements());
        responseDTO.setRecordsFiltered(paginaDeItens.getTotalElements());
        responseDTO.setData(paginaDeItens.getContent());
        return ResponseEntity.ok(responseDTO);
    }


    @PutMapping("/{numeroPatrimonial}/restaurar")
    @ResponseStatus(HttpStatus.OK)
    public void restaurarItem(@PathVariable String numeroPatrimonial, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        itemService.restaurarItem(numeroPatrimonial, usuarioLogado);
    }

    @PutMapping("/restaurar-massa")
    @ResponseStatus(HttpStatus.OK)
    public void restaurarVariosItens(@RequestBody List<String> numerosPatrimoniais, Authentication authentication) {
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        itemService.restaurarVariosItens(numerosPatrimoniais, usuarioLogado);
    }
}