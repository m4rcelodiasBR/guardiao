package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.TransferenciaDTO;
import br.com.guardiao.guardiao.controller.dto.TransferenciaMassaDTO;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.Transferencia;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import br.com.guardiao.guardiao.repository.TransferenciaRepository;
import br.com.guardiao.guardiao.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
    public Transferencia registrarTransferencia(TransferenciaDTO transferenciaDTO) {
        // PASSO 1 ATUALIZADO: Buscar o item pelo NÚMERO PATRIMONIAL
        Item item = itemRepository.findByNumeroPatrimonial(transferenciaDTO.getNumeroPatrimonial())
                .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + transferenciaDTO.getNumeroPatrimonial() + " não encontrado."));

        // O resto da lógica continua igual, pois já temos o objeto 'item' completo!
        Usuario usuario = usuarioRepository.findById(1)
                .orElseThrow(() -> new RuntimeException("Usuário padrão não encontrado."));

        Transferencia novaTransferencia = new Transferencia();
        novaTransferencia.setItem(item);
        novaTransferencia.setUsuario(usuario);
        novaTransferencia.setIncumbenciaDestino(transferenciaDTO.getIncumbenciaDestino());
        novaTransferencia.setObservacao(transferenciaDTO.getObservacao());
        novaTransferencia.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
        novaTransferencia.setDescricaoItem(item.getDescricao());

        return transferenciaRepository.save(novaTransferencia);
    }

    public List<Transferencia> listarTodasTransferencias() {
        return transferenciaRepository.findAll();
    }

    public List<Transferencia> buscarPorNumeroPatrimonial(String patrimonio) {
        return transferenciaRepository.findByNumeroPatrimonialItemContainingIgnoreCase(patrimonio);
    }

    @Transactional
    public void registrarTransferenciaEmMassa(TransferenciaMassaDTO transferenciaMassaDTO) {
        Usuario usuario = usuarioRepository.findById(1)
                .orElseThrow(() -> new RuntimeException("Usuário padrão não encontrado."));

        for (String patrimonio : transferenciaMassaDTO.getNumerosPatrimoniais()) {
            Item item = itemRepository.findByNumeroPatrimonial(patrimonio)
                    .orElseThrow(() -> new RuntimeException("Item com Patrimônio " + patrimonio + " não encontrado."));

            Transferencia transferenciaEmMassa = new Transferencia();
            transferenciaEmMassa.setItem(item);
            transferenciaEmMassa.setUsuario(usuario);
            transferenciaEmMassa.setIncumbenciaDestino(transferenciaMassaDTO.getIncumbenciaDestino());
            transferenciaEmMassa.setObservacao(transferenciaMassaDTO.getObservacao());
            transferenciaEmMassa.setNumeroPatrimonialItem(item.getNumeroPatrimonial());
            transferenciaEmMassa.setDescricaoItem(item.getDescricao());

            transferenciaRepository.save(transferenciaEmMassa);
        }
    }
}