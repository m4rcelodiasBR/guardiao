package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.TransferenciaBuscaDTO;
import br.com.guardiao.guardiao.controller.dto.TransferenciaDTO;
import br.com.guardiao.guardiao.controller.dto.TransferenciaMassaDTO;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.StatusItem;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import br.com.guardiao.guardiao.repository.specification.TransferenciaSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

        Transferencia novaTransferencia = new Transferencia();
        novaTransferencia.setItem(item);
        novaTransferencia.setUsuario(usuarioLogado);
        novaTransferencia.setIncumbenciaDestino(transferenciaDTO.getIncumbenciaDestino());
        novaTransferencia.setObservacao(transferenciaDTO.getObservacao());
        novaTransferencia.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        novaTransferencia.setDescricaoItem(item.getDescricao());

        return transferenciaRepository.save(novaTransferencia);
    }

    public List<Transferencia> listarTodasTransferencias() {
        return transferenciaRepository.findAll();
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

            Transferencia transferenciaEmMassa = new Transferencia();
            transferenciaEmMassa.setItem(item);
            transferenciaEmMassa.setUsuario(usuarioLogado);
            transferenciaEmMassa.setIncumbenciaDestino(transferenciaMassaDTO.getIncumbenciaDestino());
            transferenciaEmMassa.setObservacao(transferenciaMassaDTO.getObservacao());
            transferenciaEmMassa.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
            transferenciaEmMassa.setDescricaoItem(item.getDescricao());

            transferenciaRepository.save(transferenciaEmMassa);
        }
    }

    public List<Transferencia> buscarTransferencias(TransferenciaBuscaDTO request) {
        Specification<Transferencia> spec = transferenciaSpecification.getSpecifications(request);
        return transferenciaRepository.findAll(spec);
    }
}