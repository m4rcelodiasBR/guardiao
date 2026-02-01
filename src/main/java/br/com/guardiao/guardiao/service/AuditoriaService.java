package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.model.Auditoria;
import br.com.guardiao.guardiao.model.TipoAcao;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.AuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static br.com.guardiao.guardiao.model.TipoAcao.BLOQUEIO_TEMPORARIO_USUARIO;
import static br.com.guardiao.guardiao.model.TipoAcao.SISTEMA_ROTINA;

@Service
public class AuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaService.class);
    private static final int ANOS_RETENCAO = 5;

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    /**
     * Rotina agendada para limpeza de logs de Auditoria.
     * O processo remove registros anteriores ao período definido em {@link #ANOS_RETENCAO} anos.
     * Isso garante a integridade e performance do banco, respeitando a prescrição administrativa (se aplicável).
     */
    @Scheduled(cron = "* * 12 * * *")
    @Transactional
    public void expurgarLogsAntigos() {
        log.info("Iniciando rotina de limpeza de logs de auditoria...");
        LocalDateTime dataLimite = LocalDateTime.now().minusYears(ANOS_RETENCAO);
        long deletados = auditoriaRepository.deleteByDataHoraBefore(dataLimite);
        DateTimeFormatter dataFormatada = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        if (deletados > 0) {
            registrarLogAuditoria(
                    null,
                    TipoAcao.SISTEMA_ROTINA,
                    "Logs de Auditoria",
                    "O sistema removeu automaticamente " + deletados +
                            " registros de auditoria anteriores a " + dataLimite.format(dataFormatada)
            );
            log.info("Rotina de Limpeza concluída: {} registros antigos foram excluídos.", deletados);
        } else {
            log.info("Rotina de Limpeza concluída: Nenhum registro antigo encontrado.");
        }
    }

    /**
     * Registra uma ação de auditoria no sistema.
     * @param usuario - O usuário responsável pela ação (pode ser null em casos de sistema/login falha)
     * @param tipoAcao - O tipo da ação realizada (Enum)
     * @param objetoAfetado - Identificação do objeto (item, transferencia ou usuario)
     * @param detalhe - Texto livre ou JSON descrevendo o que mudou
     */
    @Transactional
    public void registrarLogAuditoria(Usuario usuario, TipoAcao tipoAcao, String objetoAfetado, String detalhe) {
        try {
            Auditoria auditoria = new Auditoria(usuario, tipoAcao, objetoAfetado, detalhe);
            if (usuario == null && tipoAcao == SISTEMA_ROTINA || tipoAcao == BLOQUEIO_TEMPORARIO_USUARIO) {
                auditoria.setUsuarioNome("SISTEMA");
            }
            auditoria.setIp(getClientIp());
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
    public void registrarLogAuditoria(Usuario usuario, TipoAcao tipoAcao, String objetoAfetado) {
        registrarLogAuditoria(usuario, tipoAcao, objetoAfetado, null);
    }

    private String getClientIp() {
        try {
            var attributes = RequestContextHolder.getRequestAttributes();

            if (attributes instanceof ServletRequestAttributes) {
                HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();

                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else {
                    ip = ip.split(",")[0];
                }

                if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
                    return "127.0.0.1";
                }

                if (ip != null && ip.startsWith("::ffff:")) {
                    return ip.substring(7);
                }

                return ip;
            }
        } catch (Exception e) {
            // Ignora erro se não houver requisição web
        }
        return "-";
    }

}
