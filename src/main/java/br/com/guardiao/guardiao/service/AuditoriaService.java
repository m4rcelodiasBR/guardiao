package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.model.Auditoria;
import br.com.guardiao.guardiao.model.TipoAcao;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaService {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    /**
     * Registra uma ação de auditoria no sistema.
     * @param usuario - O usuário responsável pela ação (pode ser null em casos de sistema/login falha)
     * @param tipoAcao - O tipo da ação realizada (Enum)
     * @param objetoAfetado - Identificação do objeto (item, transferencia ou usuario)
     * @param detalhe - Texto livre ou JSON descrevendo o que mudou
     */
    @Transactional
    public void registrar(Usuario usuario, TipoAcao tipoAcao, String objetoAfetado, String detalhe) {
        try {
            Auditoria auditoria = new Auditoria(usuario, tipoAcao, objetoAfetado, detalhe);
            auditoriaRepository.save(auditoria);
        } catch (Exception e) {
            System.err.println("ERRO CRÍTICO: Falha ao salvar auditoria. " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Sobrecarga para facilitar chamadas sem detalhes extras
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void registrar(Usuario usuario, TipoAcao tipoAcao, String objetoAfetado) {
        registrar(usuario, tipoAcao, objetoAfetado, null);
    }
}
