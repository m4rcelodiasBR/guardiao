package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.*;
import br.com.guardiao.guardiao.model.*;
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

    @Autowired
    private AuditoriaService auditoriaService;

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
        Transferencia transferencia = new Transferencia();
        transferencia.setItem(item);
        transferencia.setUsuario(usuarioLogado);
        transferencia.setIncumbenciaDestino(transferenciaDTO.getIncumbenciaDestino());
        transferencia.setObservacao(transferenciaDTO.getObservacao());
        transferencia.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        transferencia.setDescricaoItem(item.getDescricao());
        auditoriaService.registrarLogAuditoria(
                usuarioLogado,
                TipoAcao.TRANSFERENCIA_ITEM,
                "NumPAT: " + item.getNumeroPatrimonial(),
                "Um item foi transferido para " + transferenciaDTO.getIncumbenciaDestino()
        );
        return transferenciaRepository.save(transferencia);
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
            auditoriaService.registrarLogAuditoria(
                    usuarioLogado,
                    TipoAcao.TRANSFERENCIA_EM_MASSA_ITEM,
                    "NumPAT: " + item.getNumeroPatrimonial(),
                    "Um item transferido para " + transferenciaMassaDTO.getIncumbenciaDestino()
            );
            transferenciaRepository.save(transferencia);
        }
    }

    @Transactional
    public Page<TransferenciaDetalheDTO> listarTransferenciasParaDataTable(TransferenciaBuscaDTO transferenciaBuscaDTO, Pageable pageable) {
        Specification<Transferencia> spec = transferenciaSpecification.getSpecifications(transferenciaBuscaDTO);

        Page<Transferencia> paginaDeTransferencias = transferenciaRepository.findAll(spec, pageable);

        return paginaDeTransferencias.map(transferencia -> {
            Item itemDaTransferencia = transferencia.getItem();
            boolean podeDevolver = false;
            if (itemDaTransferencia != null && itemDaTransferencia.getStatus() == StatusItem.TRANSFERIDO) {
                boolean isUltimaTransferencia = transferenciaRepository.findTopByItemIdOrderByIdDesc(itemDaTransferencia.getId())
                        .map(ultima -> ultima.getId().equals(transferencia.getId()))
                        .orElse(false);
                String destino = transferencia.getIncumbenciaDestino();
                boolean isTransferenciaPermanente = destino != null && (destino.startsWith("000") || destino.startsWith("001") || destino.startsWith("002"));

                podeDevolver = isUltimaTransferencia && !isTransferenciaPermanente;
            }
            return new TransferenciaDetalheDTO(transferencia, podeDevolver);
        });
    }
}