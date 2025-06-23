package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.StatusItem;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import br.com.guardiao.guardiao.repository.specification.ItemSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (principal instanceof Usuario) {
            return (Usuario) principal;
        }
        throw new IllegalStateException("Usuário autenticado não encontrado no contexto de segurança.");
    }

    public Item buscarPorPatrimonio(String numeroPatrimonial) {
        return itemRepository.findByNumeroPatrimonial(numeroPatrimonial)
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + numeroPatrimonial + " não encontrado."));
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
    public void deletarItem(String numeroPatrimonial) {
        Item item = buscarPorPatrimonio(numeroPatrimonial);

        if (item.getStatus() != StatusItem.DISPONIVEL) {
            throw new IllegalStateException("Apenas itens com status DISPONIVEL podem ser baixados.");
        }

        item.setStatus(StatusItem.EXCLUIDO);
        itemRepository.save(item);
    }

    @Transactional
    public void deletarVariosItens(List<String> numerosPatrimoniais) {
        if (numerosPatrimoniais == null || numerosPatrimoniais.isEmpty()) {
            return;
        }

        List<Item> itensParaBaixar = numerosPatrimoniais.stream()
                .map(this::buscarPorPatrimonio)
                .collect(Collectors.toList());

        for (Item item : itensParaBaixar) {
            if (item.getStatus() != StatusItem.DISPONIVEL) {
                throw new IllegalStateException("O item " + item.getNumeroPatrimonial() + " não está disponível para ser baixado.");
            }
            item.setStatus(StatusItem.EXCLUIDO);
        }

        itemRepository.saveAll(itensParaBaixar);
    }

    public List<ItemAtivoDTO> buscarItensAtivos(ItemBuscaDTO request) {
        Specification<Item> spec = itemSpecification.getSpecifications(request);
        Specification<Item> specAtivo = (root, query, cb) -> cb.notEqual(root.get("status"), StatusItem.EXCLUIDO);

        List<Item> itens = itemRepository.findAll(spec.and(specAtivo));

        return itens.stream().map(item -> {
            boolean isPermanente = false;
            if (item.getStatus() == StatusItem.TRANSFERIDO) {
                transferenciaRepository.findTopByItemIdOrderByIdDesc(item.getId()).ifPresent(ultimaTransferencia -> {
                    String destino = ultimaTransferencia.getIncumbenciaDestino();
                    if (destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002")) {
                        // Não podemos setar a variável local 'isPermanente' diretamente aqui dentro do lambda.
                        // A lógica de negócio será tratar isso. Por agora, vamos simplificar.
                        // Para o frontend funcionar, vamos passar a informação se é permanente.
                        // A maneira correta seria criar uma variável de instância ou um wrapper.
                        // Mas para o propósito do DTO, esta lógica será movida.
                    }
                });
                isPermanente = transferenciaRepository.findTopByItemIdOrderByIdDesc(item.getId())
                        .map(Transferencia::getIncumbenciaDestino)
                        .map(destino -> destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002"))
                        .orElse(false);
            }
            return new ItemAtivoDTO(item, isPermanente);
        }).collect(Collectors.toList());
    }

    @Transactional
    public Item atualizarItem(String numeroPatrimonial, ItemUpdateDTO itemUpdateDTO, Usuario usuarioLogado) {

        Item itemExistente = buscarPorPatrimonio(numeroPatrimonial);

        itemExistente.setDescricao(itemUpdateDTO.getDescricao());
        itemExistente.setMarca(itemUpdateDTO.getMarca());
        itemExistente.setNumeroDeSerie(itemUpdateDTO.getNumeroDeSerie());
        itemExistente.setLocalizacao(itemUpdateDTO.getLocalizacao());
        itemExistente.setCompartimento(itemUpdateDTO.getCompartimento());
        itemExistente.setAtualizadoPor(usuarioLogado);

        return itemRepository.save(itemExistente);
    }

    @Transactional
    public Item registrarDevolucao(DevolucaoDTO devolucaoDTO) {
        Usuario usuarioLogado = getUsuarioLogado();
        Item item = buscarPorPatrimonio(devolucaoDTO.getNumeroPatrimonial());

        if (item.getStatus() != StatusItem.TRANSFERIDO) {
            throw new IllegalStateException("Este item não está marcado como transferido e não pode ser devolvido.");
        }

        item.setStatus(StatusItem.DISPONIVEL);
        item.setLocalizacao(devolucaoDTO.getLocalizacao());
        item.setCompartimento(devolucaoDTO.getCompartimento());

        Transferencia registroDevolucao = new Transferencia();
        registroDevolucao.setItem(item);
        registroDevolucao.setUsuario(usuarioLogado);
        registroDevolucao.setIncumbenciaDestino("DEVOLVIDO AO ESTOQUE");
        registroDevolucao.setObservacao(devolucaoDTO.getObservacao());
        registroDevolucao.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        registroDevolucao.setDescricaoItem(item.getDescricao());
        transferenciaRepository.save(registroDevolucao);

        return itemRepository.save(item);
    }
}