package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.StatusItem;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import br.com.guardiao.guardiao.repository.specification.TransferenciaSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TransferenciaService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TransferenciaRepository transferenciaRepository;

    @Autowired
    private TransferenciaSpecification transferenciaSpecification;

    private Usuario getUsuarioLogado() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Usuario) {
            return (Usuario) principal;
        }
        throw new IllegalStateException("Usuário autenticado não encontrado no contexto de segurança.");
    }

    @Transactional
    public Transferencia registrarTransferencia(TransferenciaDTO transferenciaDTO) {
        Usuario usuarioLogado = getUsuarioLogado();
        Item item = itemRepository.findByNumeroPatrimonial(transferenciaDTO.getNumeroPatrimonial())
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + transferenciaDTO.getNumeroPatrimonial() + " não encontrado."));

        if (item.getStatus() != StatusItem.DISPONIVEL) {
            throw new IllegalStateException("O item não está disponível para transferência.");
        }
        item.setStatus(StatusItem.TRANSFERIDO);
        item.setAtualizadoPor(usuarioLogado);
        itemRepository.save(item);
        Transferencia novaTransferencia = new Transferencia();
        novaTransferencia.setItem(item);
        novaTransferencia.setUsuario(usuarioLogado);
        novaTransferencia.setIncumbenciaDestino(transferenciaDTO.getIncumbenciaDestino());
        novaTransferencia.setObservacao(transferenciaDTO.getObservacao());
        novaTransferencia.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        novaTransferencia.setDescricaoItem(item.getDescricao());
        return transferenciaRepository.save(novaTransferencia);
    }

    @Transactional
    public void registrarTransferenciaEmMassa(TransferenciaMassaDTO transferenciaMassaDTO) {
        Usuario usuarioLogado = getUsuarioLogado();

        for (String patrimonio : transferenciaMassaDTO.getNumerosPatrimoniais()) {
            Item item = itemRepository.findByNumeroPatrimonial(patrimonio)
                    .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + patrimonio + " não encontrado."));

            if (item.getStatus() != StatusItem.DISPONIVEL) {
                throw new IllegalStateException("O item " + patrimonio + " não está disponível para transferência.");
            }
            item.setStatus(StatusItem.TRANSFERIDO);
            item.setAtualizadoPor(usuarioLogado);
            itemRepository.save(item);
            Transferencia transferencia = new Transferencia();
            transferencia.setItem(item);
            transferencia.setUsuario(usuarioLogado);
            transferencia.setIncumbenciaDestino(transferenciaMassaDTO.getIncumbenciaDestino());
            transferencia.setObservacao(transferenciaMassaDTO.getObservacao());
            transferencia.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
            transferencia.setDescricaoItem(item.getDescricao());
            transferenciaRepository.save(transferencia);
        }
    }

    public PageDTO<TransferenciaDetalheDTO> buscarTransferencias(TransferenciaBuscaDTO transferenciaBuscaDTO, Pageable pageable) {
        Specification<Transferencia> spec = transferenciaSpecification.getSpecifications(transferenciaBuscaDTO);
        Page<Transferencia> paginaDeTransferencias = transferenciaRepository.findAll(spec, pageable);

        Page<TransferenciaDetalheDTO> dtoPage = paginaDeTransferencias.map(transferencia -> {
            Item itemDaTransferencia = transferencia.getItem();
            boolean podeDevolver = false;
            if (itemDaTransferencia.getStatus() == StatusItem.TRANSFERIDO) {
                boolean isUltimaTransferencia = transferenciaRepository.findTopByItemIdOrderByIdDesc(itemDaTransferencia.getId())
                        .map(ultima -> ultima.getId().equals(transferencia.getId()))
                        .orElse(false);
                String destino = transferencia.getIncumbenciaDestino();
                boolean isTransferenciaPermanente = destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002");

                podeDevolver = isUltimaTransferencia && !isTransferenciaPermanente;
            }
            return new TransferenciaDetalheDTO(transferencia, podeDevolver);
        });
        return new PageDTO<>(dtoPage);
    }
}