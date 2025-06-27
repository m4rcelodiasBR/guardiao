package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.StatusItem;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.specification.ItemSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private TransferenciaRepository transferenciaRepository;

    @Autowired
    private ItemSpecification itemSpecification;

    public PageDTO<ItemAtivoDTO> buscarItensAtivos(ItemBuscaDTO itemBuscaDTO, Pageable pageable) {
        Specification<Item> specFromRequest = itemSpecification.getSpecifications(itemBuscaDTO);
        Specification<Item> specBase = (root, query, cb) -> cb.notEqual(root.get("status"), StatusItem.EXCLUIDO);
        Specification<Item> finalSpec = specBase.and(specFromRequest);
        Page<Item> itensPaginados = itemRepository.findAll(finalSpec, pageable);
        Page<ItemAtivoDTO> dtoPage = itensPaginados.map(item -> {
            boolean isPermanente = false;
            if (item.getStatus() == StatusItem.TRANSFERIDO) {
                isPermanente = transferenciaRepository.findTopByItemIdOrderByIdDesc(item.getId())
                        .map(t -> {
                            String destino = t.getIncumbenciaDestino();
                            return destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002");
                        })
                        .orElse(false);
            }
            return new ItemAtivoDTO(item, isPermanente);
        });
        return new PageDTO<>(dtoPage);
    }

    @Transactional
    public Item salvarItem(ItemCadastroDTO itemDTO, Usuario usuarioLogado) {
        if (itemDTO.getNumeroPatrimonial() != null && !itemDTO.getNumeroPatrimonial().isEmpty()) {
            itemRepository.findByNumeroPatrimonial(itemDTO.getNumeroPatrimonial()).ifPresent(item -> {
                throw new IllegalStateException("Número patrimonial já cadastrado.");
            });
        }
        Item novoItem = new Item();
        novoItem.setNumeroPatrimonial(itemDTO.getNumeroPatrimonial());
        novoItem.setDescricao(itemDTO.getDescricao());
        novoItem.setMarca(itemDTO.getMarca());
        novoItem.setNumeroDeSerie(itemDTO.getNumeroDeSerie());
        novoItem.setLocalizacao(itemDTO.getLocalizacao());
        novoItem.setCompartimento(itemDTO.getCompartimento());
        novoItem.setStatus(StatusItem.DISPONIVEL);
        novoItem.setCadastradoPor(usuarioLogado);
        novoItem.setAtualizadoPor(usuarioLogado);
        return itemRepository.save(novoItem);
    }

    @Transactional
    public Item atualizarItem(String numeroPatrimonial, ItemUpdateDTO dadosAtualizados, Usuario usuarioLogado) {
        Item itemExistente = buscarPorPatrimonio(numeroPatrimonial);
        itemExistente.setDescricao(dadosAtualizados.getDescricao());
        itemExistente.setMarca(dadosAtualizados.getMarca());
        itemExistente.setNumeroDeSerie(dadosAtualizados.getNumeroDeSerie());
        itemExistente.setLocalizacao(dadosAtualizados.getLocalizacao());
        itemExistente.setCompartimento(dadosAtualizados.getCompartimento());
        itemExistente.setAtualizadoPor(usuarioLogado);
        return itemRepository.save(itemExistente);
    }

    public Item buscarPorPatrimonio(String numeroPatrimonial) {
        return itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Património " + numeroPatrimonial + " não encontrado."));
    }

    @Transactional
    public void excluirItem(String numeroPatrimonial, Usuario usuarioLogado) {
        Item item = buscarPorPatrimonio(numeroPatrimonial);
        if (item.getStatus() != StatusItem.DISPONIVEL) {
            throw new IllegalStateException("Apenas itens com status DISPONIVEL podem ser excluídos.");
        }
        item.setStatus(StatusItem.EXCLUIDO);
        item.setAtualizadoPor(usuarioLogado); // CORRIGIDO: Usa o usuário logado
        itemRepository.save(item);
    }

    @Transactional
    public void excluirVariosItens(List<String> numerosPatrimoniais, Usuario usuarioLogado) {
        if (numerosPatrimoniais == null || numerosPatrimoniais.isEmpty()) {
            return;
        }
        List<Item> itensParaExcluir = numerosPatrimoniais.stream()
                .map(this::buscarPorPatrimonio)
                .collect(Collectors.toList());

        for (Item item : itensParaExcluir) {
            if (item.getStatus() != StatusItem.DISPONIVEL) {
                throw new IllegalStateException("O item " + item.getNumeroPatrimonial() + " não está disponível para ser excluído.");
            }
            item.setStatus(StatusItem.EXCLUIDO);
            item.setAtualizadoPor(usuarioLogado);
        }
        itemRepository.saveAll(itensParaExcluir);
    }

    @Transactional
    public Item registrarDevolucao(DevolucaoDTO devolucaoDTO, Usuario usuarioLogado) {
        Item item = buscarPorPatrimonio(devolucaoDTO.getNumeroPatrimonial());
        if (item.getStatus() != StatusItem.TRANSFERIDO) {
            throw new IllegalStateException("Este item não está marcado como transferido e não pode ser devolvido.");
        }
        item.setStatus(StatusItem.DISPONIVEL);
        item.setLocalizacao(devolucaoDTO.getLocalizacao());
        item.setCompartimento(devolucaoDTO.getCompartimento());
        item.setAtualizadoPor(usuarioLogado);

        Transferencia registroDevolucao = new Transferencia();
        registroDevolucao.setItem(item);
        registroDevolucao.setUsuario(usuarioLogado);
        registroDevolucao.setIncumbenciaDestino("Devolvido ao inventário");
        registroDevolucao.setObservacao(devolucaoDTO.getObservacao());
        registroDevolucao.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        registroDevolucao.setDescricaoItem(item.getDescricao());
        transferenciaRepository.save(registroDevolucao);

        return itemRepository.save(item);
    }
}