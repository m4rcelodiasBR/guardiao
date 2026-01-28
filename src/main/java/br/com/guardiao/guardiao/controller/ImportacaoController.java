package br.com.guardiao.guardiao.controller;

import br.com.guardiao.guardiao.controller.dto.ItemCadastroDTO;
import br.com.guardiao.guardiao.controller.dto.ItemValidadoDTO;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.service.ImportacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/importacao")
public class ImportacaoController {

    @Autowired
    private ImportacaoService importacaoService;

    /**
     * Endpoint para validar um ficheiro XML.
     * Recebe o ficheiro, chama o serviço para validar cada item e retorna
     * uma lista de itens validados com seus status (OK ou Erro).
     * @param file O ficheiro XML enviado pelo frontend.
     * @return Uma lista de ItemValidadoDTO.
     */
    @PostMapping("/validar")
    public ResponseEntity<List<ItemValidadoDTO>> validarArquivo(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            List<ItemValidadoDTO> resultadoValidacao = importacaoService.validarFicheiroXml(file);
            return ResponseEntity.ok(resultadoValidacao);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Endpoint para confirmar e salvar a importação.
     * Recebe a lista de itens que o utilizador selecionou na tela de pré-visualização.
     * @param itensParaImportar A lista de itens a serem salvos.
     * @param authentication Para identificar o utilizador que está a realizar a importação.
     * @return Uma resposta de sucesso com uma mensagem de resumo.
     */
    @PostMapping("/confirmar")
    public ResponseEntity<Map<String, String>> confirmarImportacao(@RequestBody List<ItemCadastroDTO> itensParaImportar,
                                                                   @RequestParam(value = "nomeArquivo", defaultValue = "Arquivo Desconhecido") String nomeArquivo,
                                                                   Authentication authentication) {
        if (itensParaImportar == null || itensParaImportar.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nenhum item selecionado para importação."));
        }
        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        importacaoService.importarItens(itensParaImportar, nomeArquivo, usuarioLogado);
        String mensagem = itensParaImportar.size() + " item(s) importado(s) com sucesso!";
        return ResponseEntity.ok(Map.of("message", mensagem));
    }
}
