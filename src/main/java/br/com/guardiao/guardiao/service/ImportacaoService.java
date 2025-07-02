package br.com.guardiao.guardiao.service;

import br.com.guardiao.guardiao.controller.dto.ItemCadastroDTO;
import br.com.guardiao.guardiao.controller.dto.ItemImportacaoDTO;
import br.com.guardiao.guardiao.controller.dto.ItemValidadoDTO;
import br.com.guardiao.guardiao.controller.dto.TabelaXmlWrapper;
import br.com.guardiao.guardiao.model.Compartimento;
import br.com.guardiao.guardiao.model.Usuario;
import br.com.guardiao.guardiao.repository.ItemRepository;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import org.springframework.beans.factory.annotation.Autowired;
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
    private ItemService itemService;

    private static final List<String> MARCAS_CONHECIDAS = List.of(
            "HP", "HPE", "DELL", "CISCO", "3COM", "APC", "SMS",
            "IMATION", "RACKTRON", "MIDEA", "AGRATTO", "INTELBRAS", "GENIUS",
            "RAGTECH", "LG", "SAMSUNG", "ACER", "DLINK", "PHILLIPS", "AOC"
    );

    public List<ItemValidadoDTO> validarFicheiroXml(MultipartFile file) throws IOException {
        XmlMapper xmlMapper = new XmlMapper();
        TabelaXmlWrapper wrapper = xmlMapper.readValue(file.getInputStream(), TabelaXmlWrapper.class);
        List<ItemValidadoDTO> resultados = new ArrayList<>();

        for (ItemImportacaoDTO itemImportado : wrapper.getRows()) {
            List<String> colunas = itemImportado.getColunas();
            if (colunas == null || colunas.size() < 11) {
                continue; // Ignora linhas malformadas
            }

            ItemCadastroDTO itemCadastro = new ItemCadastroDTO();
            // Mapeamento baseado na análise do seu XML
            itemCadastro.setNumeroPatrimonial(colunas.get(0).trim());
            itemCadastro.setDescricao(colunas.get(1).trim());

            // Extração inteligente de Marca e Nº de Série
            extrairDadosDaDescricao(itemCadastro);

            // Mapeamento do Compartimento
            String compartimentoStr = colunas.get(10).trim();
            try {
                Compartimento compartimento = Compartimento.valueOf(compartimentoStr.toUpperCase());
                itemCadastro.setCompartimento(compartimento);
            } catch (IllegalArgumentException e) {

            }

            // Validação
            String erro = validarItem(itemCadastro);
            if (erro == null) {
                resultados.add(new ItemValidadoDTO(itemCadastro));
            } else {
                resultados.add(new ItemValidadoDTO(itemCadastro, erro));
            }
        }
        return resultados;
    }

    @Transactional
    public void importarItens(List<ItemCadastroDTO> itensParaImportar, Usuario usuarioLogado) {
        for (ItemCadastroDTO itemDTO : itensParaImportar) {
            itemService.salvarItem(itemDTO, usuarioLogado);
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

    private String validarItem(ItemCadastroDTO item) {
        if (item.getNumeroPatrimonial() == null || !item.getNumeroPatrimonial().matches("^[0-9]{9}$")) {
            return "Erro: Número Patrimonial inválido ou ausente.";
        }
        if (item.getDescricao() == null || item.getDescricao().trim().isEmpty()) {
            return "Erro: Descrição é obrigatória.";
        }
        if (itemRepository.findByNumeroPatrimonial(item.getNumeroPatrimonial()).isPresent()) {
            return "Erro: Número Patrimonial já existe no sistema.";
        }
        return null;
    }
}
