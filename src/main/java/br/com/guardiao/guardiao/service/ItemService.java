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
import org.springframework.util.StringUtils;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
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

        String novoNumeroDeSerie = dadosAtualizados.getNumeroDeSerie();

        if (StringUtils.hasText(novoNumeroDeSerie)) {
            itemRepository.findByNumeroDeSerieAndIdNot(novoNumeroDeSerie, itemExistente.getId())
                    .ifPresent(itemEncontrado -> {
                        throw new IllegalStateException("Erro: Número de Série já cadastrado no item com NumPAT " + itemEncontrado.getNumeroPatrimonial());
                    });
        }

        itemExistente.setDescricao(dadosAtualizados.getDescricao());
        itemExistente.setMarca(dadosAtualizados.getMarca());

        if (Objects.equals(novoNumeroDeSerie, "")) {
            itemExistente.setNumeroDeSerie(null);
        } else {
            itemExistente.setNumeroDeSerie(novoNumeroDeSerie);
        }
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

    @Transactional
    public void atualizarVariosItens(ItemEdicaoMassaDTO edicaoMassaDTO, Usuario usuarioLogado) {
        List<Item> itensParaAtualizar = edicaoMassaDTO.getNumerosPatrimoniais().stream()
                .map(this::buscarPorPatrimonio)
                .collect(Collectors.toList());
        for (Item item : itensParaAtualizar) {
            if (item.getStatus() != StatusItem.DISPONIVEL) {
                throw new IllegalStateException("O item com patrimônio " + item.getNumeroPatrimonial() + " não está disponível para edição em massa.");
            }
            if (StringUtils.hasText(edicaoMassaDTO.getLocalizacao())) {
                item.setLocalizacao(edicaoMassaDTO.getLocalizacao());
            }
            if (edicaoMassaDTO.getCompartimento() != null) {
                item.setCompartimento(edicaoMassaDTO.getCompartimento());
            }
            item.setAtualizadoPor(usuarioLogado);
        }
        itemRepository.saveAll(itensParaAtualizar);
    }

    @Transactional
    public void salvarOuReativarItem(ItemCadastroDTO itemCadastroDTO, Usuario usuarioLogado) {
        var itemExistenteOpt = itemRepository.findByNumeroPatrimonial(itemCadastroDTO.getNumeroPatrimonial());

        if (itemExistenteOpt.isPresent() && itemExistenteOpt.get().getStatus() == StatusItem.EXCLUIDO) {
            Item itemParaReativar = itemExistenteOpt.get();
            itemParaReativar.setDescricao(itemCadastroDTO.getDescricao());
            itemParaReativar.setMarca(itemCadastroDTO.getMarca());
            itemParaReativar.setCompartimento(itemCadastroDTO.getCompartimento());
            itemParaReativar.setStatus(StatusItem.DISPONIVEL);
            itemParaReativar.setAtualizadoPor(usuarioLogado);
            itemRepository.save(itemParaReativar);
        } else {
            salvarItem(itemCadastroDTO, usuarioLogado);
        }
    }

    public Page<ItemAtivoDTO> buscarItensParaDataTable(ItemBuscaDTO itemBuscaDTO, String globalSearchValue, Pageable pageable) {
        Specification<Item> specFromAdvancedSearch = itemSpecification.getSpecifications(itemBuscaDTO);
        Specification<Item> specFromGlobalSearch = itemSpecification.hasGlobalSearch(globalSearchValue);
        Specification<Item> specBase = (root, query, cb) -> cb.notEqual(root.get("status"), StatusItem.EXCLUIDO);

        Specification<Item> finalSpec = specBase.and(specFromAdvancedSearch)
                .and(specFromGlobalSearch);

        Page<Item> itensPaginados = itemRepository.findAll(finalSpec, pageable);

        List<Integer> idsDosItensTransferidos = itensPaginados.getContent().stream()
                .filter(item -> item.getStatus() == StatusItem.TRANSFERIDO)
                .map(Item::getId)
                .collect(Collectors.toList());

        Map<Integer, Transferencia> ultimasTransferenciasPorItemId =
                transferenciaRepository.findLatestTransferenciaForItens(idsDosItensTransferidos)
                        .stream()
                        .collect(Collectors.toMap(t -> t.getItem().getId(), Function.identity()));

        return itensPaginados.map(item -> {
            boolean isPermanente = false;
            String nomeIncumbencia = null;

            if (item.getStatus() == StatusItem.TRANSFERIDO) {
                Transferencia ultimaTransferencia = ultimasTransferenciasPorItemId.get(item.getId());
                if (ultimaTransferencia != null) {
                    String destino = ultimaTransferencia.getIncumbenciaDestino();
                    isPermanente = destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002");
                    nomeIncumbencia = destino;
                }
            }
            ItemAtivoDTO dto = new ItemAtivoDTO(item, isPermanente);
            dto.setUltimaIncumbencia(nomeIncumbencia);
            return dto;
        });
    }

    public Page<ItemAtivoDTO> buscarItensExcluidosParaDataTable(ItemBuscaDTO itemBuscaDTO, String globalSearchValue, Pageable pageable) {
        Specification<Item> specFromAdvancedSearch = itemSpecification.getSpecifications(itemBuscaDTO);
        Specification<Item> specFromGlobalSearch = itemSpecification.hasGlobalSearch(globalSearchValue);
        Specification<Item> specStatusExcluido = (root, query, cb) -> cb.equal(root.get("status"), StatusItem.EXCLUIDO);

        Specification<Item> finalSpec = specStatusExcluido.and(specFromAdvancedSearch)
                .and(specFromGlobalSearch);

        Page<Item> itensPaginados = itemRepository.findAll(finalSpec, pageable);
        return itensPaginados.map(item -> new ItemAtivoDTO(item, false));
    }

    @Transactional
    public void restaurarItem(String numeroPatrimonial, Usuario usuarioLogado) {
        Item item = buscarPorPatrimonio(numeroPatrimonial);
        if (item.getStatus() != StatusItem.EXCLUIDO) {
            throw new IllegalStateException("Apenas itens excluídos pode ser restaurados.");
        }
        item.setStatus(StatusItem.DISPONIVEL);
        item.setAtualizadoPor(usuarioLogado);
        itemRepository.save(item);
    }

    @Transactional
    public void restaurarVariosItens(List<String> numerosPatrimoniais, Usuario usuarioLogado) {
        if (numerosPatrimoniais == null || numerosPatrimoniais.isEmpty()) return;

        List<Item> itensParaRestaurar = numerosPatrimoniais.stream()
                .map(this::buscarPorPatrimonio)
                .toList();

        for (Item item : itensParaRestaurar) {
            if (item.getStatus() != StatusItem.EXCLUIDO) {
                continue;
            }
            item.setStatus(StatusItem.DISPONIVEL);
            item.setAtualizadoPor(usuarioLogado);
        }
        itemRepository.saveAll(itensParaRestaurar);
    }
}