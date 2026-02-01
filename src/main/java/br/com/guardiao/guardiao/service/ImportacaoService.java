package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.ItemCadastroDTO;
import br.com.guardiao.guardiao.controller.dto.ItemImportacaoDTO;
import br.com.guardiao.guardiao.controller.dto.ItemValidadoDTO;
import br.com.guardiao.guardiao.controller.dto.TabelaXmlWrapper;
import br.com.guardiao.guardiao.model.Compartimento;
import br.com.guardiao.guardiao.model.Item;
import br.com.guardiao.guardiao.model.TipoAcao;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImportacaoService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    @Lazy
    private ItemService itemService;

    @Autowired
    private AuditoriaService auditoriaService;

    private static final List<String> MARCAS_CONHECIDAS = List.of(
            "HP", "HPE", "DELL", "CISCO", "3COM", "APC", "SMS",
            "IMATION", "RACKTRON", "MIDEA", "AGRATTO", "INTELBRAS", "GENIUS",
            "RAGTECH", "LG", "SAMSUNG", "ACER", "DLINK", "PHILIPS", "AOC", "NHS",
            "ELECTROLUX", "TENDA", "MICROSOFT", "MAXXTRO", "WALITA", "THERMALTAKE",
            "MUNDIAL", "MONDIAL"
    );

    public List<ItemValidadoDTO> validarFicheiroXml(MultipartFile file) throws IOException {
        XmlMapper xmlMapper = new XmlMapper();
        TabelaXmlWrapper wrapper = xmlMapper.readValue(file.getInputStream(), TabelaXmlWrapper.class);
        List<ItemValidadoDTO> resultados = new ArrayList<>();
        for (ItemImportacaoDTO itemImportado : wrapper.getRows()) {
            List<String> colunas = itemImportado.getColunas();

            if (colunas == null || colunas.size() < 11) {
                continue;
            }

            ItemCadastroDTO itemCadastro = new ItemCadastroDTO();
            itemCadastro.setNumeroPatrimonial(colunas.get(0).trim());
            itemCadastro.setDescricao(colunas.get(1).trim());

            extrairDadosDaDescricao(itemCadastro);

            String compartimentoStr = colunas.get(10).trim();
            try {
                Compartimento compartimento = Compartimento.valueOf(compartimentoStr.toUpperCase());
                itemCadastro.setCompartimento(compartimento);
            } catch (IllegalArgumentException e) {
                // Ignora se o compartimento for inválido, a validação pegará depois se for obrigatório
            }

            resultados.add(validarItem(itemCadastro));
        }
        return resultados;
    }

    @Transactional
    public void importarItens(List<ItemCadastroDTO> itensParaImportar, String nomeArquivo, Usuario usuarioLogado) {
        auditoriaService.registrarLogAuditoria(
                usuarioLogado,
                TipoAcao.IMPORTACAO_XML_ITEM,
                "Arquivo XML: " + nomeArquivo,
                "Iniciada a importação de " + itensParaImportar.size() + " item(ns)."
        );
        for (ItemCadastroDTO itemDTO : itensParaImportar) {
            itemService.salvarOuReativarItem(itemDTO, usuarioLogado);
        }
    }

    private void extrairDadosDaDescricao(ItemCadastroDTO item) {
        String descricao = item.getDescricao().toUpperCase();

        for (String marca : MARCAS_CONHECIDAS) {
            if (descricao.contains(marca)) {
                item.setMarca(marca);
                break;
            }
        }
    }

    private ItemValidadoDTO validarItem(ItemCadastroDTO item) {
        if (item.getNumeroPatrimonial() == null || !item.getNumeroPatrimonial().matches("^[0-9]{9}$")) {
            return new ItemValidadoDTO(item, ItemValidadoDTO.StatusValidacao.INVALIDO, "Erro: Número Patrimonial inválido ou ausente.");
        }

        if (item.getDescricao() == null || item.getDescricao().trim().isEmpty()) {
            return new ItemValidadoDTO(item, ItemValidadoDTO.StatusValidacao.INVALIDO, "Erro: Descrição é obrigatória.");
        }

        var itemExistenteOpt = itemRepository.findByNumeroPatrimonial(item.getNumeroPatrimonial());

        if (itemExistenteOpt.isPresent()) {
            Item itemDoBanco = itemExistenteOpt.get();
            if (itemDoBanco.getStatus() == br.com.guardiao.guardiao.model.StatusItem.EXCLUIDO) {
                return new ItemValidadoDTO(item, ItemValidadoDTO.StatusValidacao.VALIDO_COM_AVISO, "Aviso: Item já existe e será reativado.");
            } else {
                return new ItemValidadoDTO(item, ItemValidadoDTO.StatusValidacao.INVALIDO, "Erro: Item já existe e está ativo no sistema.");
            }
        }
        return new ItemValidadoDTO(item, ItemValidadoDTO.StatusValidacao.VALIDO, "OK para importar.");
    }
}
