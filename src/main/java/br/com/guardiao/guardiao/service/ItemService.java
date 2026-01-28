package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.*;
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

import java.util.ArrayList;
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

    @Autowired
    private AuditoriaService auditoriaService;

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
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.CRIACAO_ITEM,
                "NumPAT " + itemDTO.getNumeroPatrimonial(),
                "Um item foi cadastrado. Descrição: " + itemDTO.getDescricao());
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

        String dadosAlterados = detectarAlteracoesItem(itemExistente, dadosAtualizados);

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
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.EDICAO_ITEM,
                "NumPAT: " + numeroPatrimonial,
                "Um item foi atualizado." + dadosAlterados
        );
        return itemRepository.save(itemExistente);
    }

    @Transactional
    public void atualizarVariosItens(ItemEdicaoMassaDTO edicaoMassaDTO, Usuario usuarioLogado) {
        List<Item> itensParaAtualizar = edicaoMassaDTO.getNumerosPatrimoniais().stream()
                .map(this::buscarPorPatrimonio)
                .collect(Collectors.toList());
        for (Item item : itensParaAtualizar) {
            String dadosAlterados = detectarAlteracoesMassaItem(item, edicaoMassaDTO);
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
            auditoriaService.registrar(
                    usuarioLogado,
                    TipoAcao.EDICAO_EM_MASSA_ITEM,
                    "NumPAT: " + item.getNumeroPatrimonial(),
                    "Um itens foram alterados." + dadosAlterados
            );
        }
        itemRepository.saveAll(itensParaAtualizar);
    }

    @Transactional
    public void excluirItem(String numeroPatrimonial, Usuario usuarioLogado) {
        Item item = buscarPorPatrimonio(numeroPatrimonial);
        if (item.getStatus() != StatusItem.DISPONIVEL) {
            throw new IllegalStateException("Apenas itens com status DISPONIVEL podem ser excluídos.");
        }
        item.setStatus(StatusItem.EXCLUIDO);
        item.setAtualizadoPor(usuarioLogado);
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.EXCLUSAO_ITEM,
                "NumPAT: " + numeroPatrimonial,
                "Um item excluído."
        );
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
            auditoriaService.registrar(
                    usuarioLogado,
                    TipoAcao.EXCLUSAO_EM_MASSA_ITEM,
                    "NumPAT: " + item.getNumeroPatrimonial(),
                    "Um item foi excluído."
            );
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
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.DEVOLUCAO_ITEM,
                "NumPAT: " + item.getNumeroPatrimonial(),
                "Um item foi devolvido ao inventário. Obs: " + devolucaoDTO.getObservacao()
        );
        return itemRepository.save(item);
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
            auditoriaService.registrar(
                    usuarioLogado,
                    TipoAcao.REATIVACAO_ITEM,
                    "NumPAT: " + itemParaReativar.getNumeroPatrimonial(),
                    "Um item reativado automaticamente via Importação XML."
            );
        } else {
            salvarItem(itemCadastroDTO, usuarioLogado);
        }
    }

    @Transactional
    public void restaurarItem(String numeroPatrimonial, Usuario usuarioLogado) {
        Item item = buscarPorPatrimonio(numeroPatrimonial);
        if (item.getStatus() != StatusItem.EXCLUIDO) {
            throw new IllegalStateException("Apenas itens excluídos pode ser restaurados.");
        }
        item.setStatus(StatusItem.DISPONIVEL);
        item.setAtualizadoPor(usuarioLogado);
        auditoriaService.registrar(
                usuarioLogado,
                TipoAcao.RESTAURACAO_ITEM,
                "NumPAT: " + numeroPatrimonial,
                "Um item foi restaurado."
        );
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
            auditoriaService.registrar(
                    usuarioLogado,
                    TipoAcao.RESTAURACAO_EM_MASSA_ITEM,
                    "NumPAT: " + item.getNumeroPatrimonial(),
                    "Um item foi restaurado."
            );
        }
        itemRepository.saveAll(itensParaRestaurar);
    }

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

    public Item buscarPorPatrimonio(String numeroPatrimonial) {
        return itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Património " + numeroPatrimonial + " não encontrado."));
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

    /**
     * Metodo auxiliar para detectar alterações de dados cadastrais de itens do inventário
     * para alimentar os logs do serviço de Auditoria do sistema.
     */
    private String detectarAlteracoesItem(Item dadosAntigosItem, ItemUpdateDTO dadosNovosItem) {
        List<String> mudancas = new ArrayList<>();

        if (!Objects.equals(dadosAntigosItem.getDescricao(), dadosNovosItem.getDescricao())) {
            mudancas.add("Descrição; " + dadosAntigosItem.getDescricao() + " -> " + dadosNovosItem.getDescricao());
        }

        if (!Objects.equals(dadosAntigosItem.getMarca(), dadosNovosItem.getMarca())) {
            mudancas.add("Marca: " + dadosAntigosItem.getMarca() + " -> " + dadosNovosItem.getMarca());
        }

        if (!Objects.equals(dadosAntigosItem.getNumeroDeSerie(), dadosNovosItem.getNumeroDeSerie())) {
            mudancas.add("N/S: " + dadosAntigosItem.getNumeroDeSerie() + " -> " + dadosNovosItem.getNumeroDeSerie());
        }

        String compartimentoAntigo = dadosAntigosItem.getCompartimento() != null ? dadosAntigosItem.getCompartimento().getCodigo() : "N/A";
        String compartimentoNovo = dadosNovosItem.getCompartimento() != null ? dadosNovosItem.getCompartimento().getCodigo() : "N/A";
        if (!Objects.equals(compartimentoAntigo, compartimentoNovo)) {
            mudancas.add("Compartimento: " + compartimentoAntigo + " -> " + compartimentoNovo);
        }

        if (!Objects.equals(dadosAntigosItem.getLocalizacao(), dadosNovosItem.getLocalizacao())) {
            mudancas.add("Localização: " + dadosAntigosItem.getLocalizacao() + " -> " + dadosNovosItem.getLocalizacao());
        }

        return mudancas.isEmpty() ? "Edição sem mudanças de campos monitorados." : String.join("; ", mudancas);
    }

    /**
     * Metodo auxiliar para detectar alterações de dados cadastrais de vários itens do inventário
     * para alimentar os logs do serviço de Auditoria do sistema.
     */
    private String detectarAlteracoesMassaItem(Item dadosAntigosItem, ItemEdicaoMassaDTO dadosNovosItem) {
        List<String> mudancas = new ArrayList<>();

        if (dadosNovosItem.getLocalizacao() != null && !Objects.equals(dadosAntigosItem.getLocalizacao(), dadosNovosItem.getLocalizacao())) {
            mudancas.add("Localização: " + (dadosAntigosItem.getLocalizacao() != null ? dadosAntigosItem.getLocalizacao() : "Vazio")
                    + " -> " + dadosNovosItem.getLocalizacao());
        }

        if (dadosNovosItem.getCompartimento() != null) {
            String compAntigo = dadosAntigosItem.getCompartimento() != null ? dadosAntigosItem.getCompartimento().getCodigo() : "N/A";
            String compNovo = dadosNovosItem.getCompartimento().getCodigo();
            if (!Objects.equals(compAntigo, compNovo)) {
                mudancas.add("Compartimento: " + compAntigo + " -> " + compNovo);
            }
        }

        return mudancas.isEmpty() ? "Item processado no lote (sem alterações efetivas)." : String.join("; ", mudancas);
    }

}