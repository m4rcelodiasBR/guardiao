package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.DevolucaoDTO;
import br.com.guardiao.guardiao.controller.dto.ItemBuscaDTO;
import br.com.guardiao.guardiao.controller.dto.ItemUpdateDTO;
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

    public Item salvarItem(Item item) {
        item.setStatus(StatusItem.DISPONIVEL);
        return itemRepository.save(item);
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

    public List<Item> buscarItensAtivos(ItemBuscaDTO itemBuscaDTO) {
        Specification<Item> spec = itemSpecification.getSpecifications(itemBuscaDTO);

        Specification<Item> specAtivo = (root, query, criteriaBuilder) ->
                criteriaBuilder.notEqual(root.get("status"), StatusItem.EXCLUIDO);

        return itemRepository.findAll(spec.and(specAtivo));
    }

    @Transactional
    public Item atualizarItem(String numeroPatrimonial, ItemUpdateDTO dadosAtualizados) {

        Item itemExistente = buscarPorPatrimonio(numeroPatrimonial);

        itemExistente.setDescricao(dadosAtualizados.getDescricao());
        itemExistente.setMarca(dadosAtualizados.getMarca());
        itemExistente.setNumeroDeSerie(dadosAtualizados.getNumeroDeSerie());
        itemExistente.setLocalizacao(dadosAtualizados.getLocalizacao());
        itemExistente.setCompartimento(dadosAtualizados.getCompartimento());

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