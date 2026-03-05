"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMDINHEIRO_ENDPOINTS = void 0;
exports.COMDINHEIRO_ENDPOINTS = {
    // Carteiras e Portfólios
    CarteiraExplodida001: {
        url: "CarteiraExplodida001.php",
        description: "Composição detalhada da carteira por tipo de ativo",
        params: ["nome_portfolio", "data_fim", "classe", "cart_explodida", "exibicao", "ord_ativo", "ord_classe", "num_casas"]
    },
    CarteiraFundo001: {
        url: "CarteiraFundo001",
        description: "Composição interna de fundos de investimento por CNPJ",
        params: ["cnpj", "data", "classe_do_ativo", "exibicao", "nivel"]
    },
    CarteiraFundo002: {
        url: "CarteiraFundo002",
        description: "Carteira expandida com sub-níveis",
        params: ["cnpj", "data", "classe_do_ativo", "nivel", "coluna"]
    },
    CarteiraFundo006: {
        url: "CarteiraFundo006",
        description: "Carteira simplificada fundo",
        params: ["cnpj", "data", "nenhuma", "nivel"]
    },
    CarteiraPortfolio001: {
        url: "CarteiraPortfolio001",
        description: "Performance e composição de portfólio personalizado",
        params: ["nome_portfolio", "data_ini", "data_fim", "benchmarks", "periodos"]
    },
    PosicaoConsolidada001: {
        url: "PosicaoConsolidada001.php",
        description: "Posição consolidada de todas as carteiras",
        params: ["nome_portfolio", "data_ini", "data_fim", "classe", "layout", "pos"]
    },
    PosicaoConsolidada002: {
        url: "PosicaoConsolidada002.php",
        description: "Posição com rosca gráfica por subcarteira",
        params: ["nome_portfolio", "data_analise", "tipo_grafico", "opcao_grafico"]
    },
    MinhaCarteiraXML001: {
        url: "MinhaCarteiraXML001",
        description: "Export XML da carteira — integração externa",
        params: ["data_ini", "data_fim"]
    },
    MeuPortfolio: {
        url: "MeuPortfolio",
        description: "Lista de portfolios cadastrados no sistema",
        params: ["flag", "tipo", "ordem"]
    },
    NovaDAIR002: {
        url: "NovaDAIR002",
        description: "DAIR: Alocação e Informações de Risco mensal",
        params: ["nome_portfolio", "data_ini", "data_fim"]
    },
    // Extratos e Relatórios Gerenciais
    ExtratoCarteira001: {
        url: "ExtratoCarteira001",
        description: "Extrato básico de carteira com retornos por período e classe",
        params: ["nome_carteira", "data_ini", "data_fim", "cot_tir", "benchmarks", "ret"]
    },
    ExtratoCarteira020: {
        url: "ExtratoCarteira020.php",
        description: "Extrato com alocação gráfica e PDF Silo",
        params: ["nome_portfolio", "data_fim", "benchmarks", "ret", "ret2", "aloc", "graf_linha", "estilo_pdf"]
    },
    ExtratoCarteira022: {
        url: "ExtratoCarteira022.php",
        description: "Extrato completo MFO: posição, liquidez, movimentação, gráficos",
        params: ["nome_portfolio", "data_ini", "data_fim", "classe", "ret", "ret2", "ret3", "pos", "aloc", "liq"]
    },
    ExtratoCarteira023: {
        url: "ExtratoCarteira023.php",
        description: "Extrato com evolução gráfica vs benchmarks",
        params: ["nome_portfolio", "benchmarks", "ret", "ret3", "graf_linha", "tipo_graf_evol"]
    },
    ExtratoCarteira024: {
        url: "ExtratoCarteira024.php",
        description: "Extrato executivo MFO com liquidez e alocação por tipo/gestor",
        params: ["nome_portfolio", "aloc", "ret", "ret2", "liq", "infoAdd_bench"]
    },
    RelatorioGerencial002: {
        url: "RelatorioGerencialCarteiras002.php",
        description: "Gerencial mensal com eventos e tipos de ativo",
        params: ["nome_portfolio", "data_ini", "data_fim", "filtro_eventos", "filtro_tipo_ativo"]
    },
    RelatorioGerencial006: {
        url: "RelatorioGerencialCarteiras006.php",
        description: "Histórico de rentabilidade consolidada desde início",
        params: ["nome_portfolio", "data_ini", "data_fim", "num_casas"]
    },
    RelatorioGerencial008: {
        url: "RelatorioGerencialCarteiras008.php",
        description: "Snapshot de posição em data de análise",
        params: ["nome_portfolio", "data_analise", "num_casas", "valores"]
    },
    RelatorioGerencial009: {
        url: "RelatorioGerencialCarteiras009.php",
        description: "Relatório de cotização com movimentos do mês",
        params: ["nome_portfolio", "data_analise", "data_ini", "cotizacao"]
    },
    ComprasVendas002: {
        url: "ComprasVendas002.php",
        description: "Histórico de compras e vendas da carteira",
        params: []
    },
    // Risco e Modelagem Quantitativa
    Value_at_Risk001: {
        url: "Value_at_Risk001.php",
        description: "Value at Risk (VaR) histórico",
        params: ["papeis", "quantidades", "intervalo_confianca", "modelo_linear_quadratico", "retorno_tipo", "var_du", "explodir_fundo"]
    },
    Markowitz001: {
        url: "Markowitz001.php",
        description: "Otimização de Markowitz",
        params: ["papeis", "quantidades", "otimizar", "risco_meta", "benchmark_sharpe", "pontos_fronteira", "limite_pesos", "mostrar_cart_atual"]
    },
    Risco001: {
        url: "Risco001.php",
        description: "Matriz de risco e retorno",
        params: ["ticker", "data_ini", "data_fim", "retorno", "risco_grafico", "benchmark", "exportar"]
    },
    StressTest001: {
        url: "StressTest001.php",
        description: "Stress test linear/quadrático",
        params: ["papeis", "quantidades", "modelo_linear_quadratico", "lambda_ewma", "usar_beta", "explodir_fundo"]
    },
    RiscoLiquidez001: {
        url: "RiscoLiquidez001.php",
        description: "Análise de risco de liquidez",
        params: ["data_analise", "intervalo_dias", "papeis", "quantidades", "intervalos_liquidez", "explodir_fundo"]
    },
    DrawDownAcumulado001: {
        url: "DrawDownAcumulado001.php",
        description: "Série histórica de drawdown acumulado",
        params: ["ativos", "data_ini", "data_fim", "tipo_data", "tipo_grafico"]
    },
    LaminaRisco001: {
        url: "LaminaRisco001",
        description: "Lâmina risco individual",
        params: ["ticker", "data_ini", "data_fim", "benchmark"]
    },
    LaminaRisco002: {
        url: "LaminaRisco002",
        description: "Lâmina risco avançada",
        params: ["ticker", "data_ini", "data_fim", "janela", "benchmarkRF", "benchmarkRV"]
    },
    LaminaRisco003: {
        url: "LaminaRisco003",
        description: "Lâmina risco estilo 3",
        params: ["ticker", "data_ini", "data_fim", "janela", "benchmarkRV"]
    },
    IndicadoresRiscoMultiplo002: {
        url: "IndicadoresRiscoMultiplo002.php",
        description: "Indicadores de risco múltiplos por ativo",
        params: ["ticker", "data_intervalos", "benchmarkRV", "benchmarkRF", "indicadores"]
    },
    IndicadoresRiscoMultiplo003: {
        url: "IndicadoresRiscoMultiplo003.php",
        description: "Indicadores com janela customizável",
        params: ["ticker", "data_ini", "data_fim", "janela_du", "indicadores", "design"]
    },
    AnaliseEstilo001: {
        url: "AnaliseEstilo001.php",
        description: "Análise de Estilo (Style Analysis)",
        params: ["ticker", "data_ini", "data_fim", "benchmarks", "janela", "periodicidade"]
    },
    // Fundos de Investimento
    FundScreener001: {
        url: "FundScreener001.php",
        description: "Screener completo de fundos CVM/ANBIMA",
        params: ["data_rr", "data_cart", "variaveis", "gr_classe", "cl_cvm", "gestor", "situacao", "periodicidade"]
    },
    ComparaFundos001: {
        url: "ComparaFundos001.php",
        description: "Comparação de fundos por CNPJ",
        params: ["datas", "cnpjs", "indicadores", "pc", "flag_transpor"]
    },
    HistoricoIndicadoresFundos001: {
        url: "HistoricoIndicadoresFundos001.php",
        description: "Série histórica de indicadores de fundos",
        params: ["cnpjs", "data_ini", "data_fim", "indicadores", "periodicidade", "transpor"]
    },
    LaminaFundo021: {
        url: "LaminaFundo021",
        description: "Lâmina completa do fundo com PDF Silo",
        params: ["cnpj", "data_ini", "data_fim", "benchmarks", "pdf", "estilo_pdf"]
    },
    FundoQuotistas001: {
        url: "FundoQuotistas001",
        description: "Dados de quotistas do fundo",
        params: ["cnpj", "data", "flag_dados"]
    },
    FundoQuotistas002: {
        url: "FundoQuotistas002",
        description: "Quotistas com dados alternativos",
        params: ["cnpj", "data", "flag_dados"]
    },
    FundoQuotistas003: {
        url: "FundoQuotistas003",
        description: "Quotistas versão 3",
        params: ["cnpj", "data", "tipo_dados"]
    },
    FundoQuotistas005: {
        url: "FundoQuotistas005",
        description: "Quotistas agrupados",
        params: ["cnpj", "data", "tipo", "flag_dados", "qtd_grupos"]
    },
    FundoQuotistas006: {
        url: "FundoQuotistas006",
        description: "Quotistas com percentual",
        params: ["cnpj", "data", "flag", "qtd_grupos", "flag_dados", "flag_percent"]
    },
    FundoQuotistas007: {
        url: "FundoQuotistas007",
        description: "Quotistas com administrador",
        params: ["cnpj_fundo", "cnpj_adm", "data", "tipo", "qtd", "percent"]
    },
    // Renda Fixa e Títulos
    FixedIncomeScreener001: {
        url: "FixedIncomeScreener001.php",
        description: "Screener de títulos de renda fixa",
        params: ["variaveis", "tipo_ativo", "indexador", "data_ini_emissao", "data_fim_vencimento", "situacao"]
    },
    Duration001: {
        url: "Duration001.php",
        description: "Duration (Macaulay e Modificada)",
        params: ["data", "papeis", "quantidades", "num_casas", "check_duration", "flag_discrimina_juros"]
    },
    SimulaRF001: {
        url: "SimulaRF001",
        description: "Simulação de rentabilidade de título de renda fixa",
        params: ["data_compra", "papel", "preco_compra", "quantidade", "flag_ajuste", "base_dias"]
    },
    SimulaRF002: {
        url: "SimulaRF002",
        description: "Simulação com data de venda definida",
        params: ["data_compra", "data_venda", "papel", "taxa", "quantidade", "base_dias"]
    },
    HistoricoTitulosPublicos: {
        url: "HistoricoTitulosPublicos",
        description: "Série histórica de cotações de títulos públicos",
        params: ["papel", "data_ini", "data_fim", "tipo_preco", "benchmark"]
    },
    HistoricoCotacaoDebentures001: {
        url: "HistoricoCotacaoDebentures001",
        description: "Histórico de cotações de debêntures",
        params: ["debenture", "data_ini", "data_fim", "tipo", "benchmark"]
    },
    EmissoesCDB001: {
        url: "EmissoesCDB001",
        description: "Emissões de CDB por banco emissor",
        params: ["data_ini", "data_fim", "cnpj_emissor", "tipo_indexador", "valor_min", "valor_max"]
    },
    EmissoesCDB002: {
        url: "EmissoesCDB002",
        description: "CDB com filtro de taxa",
        params: ["data_ini", "data_fim", "valor_min", "valor_max", "cnpj_emissor", "indexador", "taxa_tipo"]
    },
    CurvaJuros: {
        url: "CurvaJuros",
        description: "Curva de juros do mercado",
        params: ["data", "tipo", "vertices", "base", "flag_calendario"]
    },
    AgendaProventos001: {
        url: "AgendaProventos001.php",
        description: "Agenda de eventos futuros de títulos",
        params: ["x", "data_ini", "data_fim", "tipo_evento", "num_casas"]
    },
    // Renda Variável e Fundamentalista
    StockScreenerFull: {
        url: "StockScreenerFull.php",
        description: "Screener fundamentalista completo de ações",
        params: ["variaveis", "data_analise", "segmento", "setor", "tipo_acao", "acumular", "demonstracao", "periodicidade"]
    },
    StockScreenerCadastral001: {
        url: "StockScreenerCadastral001",
        description: "Screener cadastral de empresas",
        params: ["data", "tipo", "todos"]
    },
    ComparaEmpresas001: {
        url: "ComparaEmpresas001.php",
        description: "Comparação de empresas por indicadores fundamentalistas",
        params: ["papeis", "data_a", "data_d", "indic", "c_c", "trailing", "conv"]
    },
    BalancosSinteticos001: {
        url: "BalancosSinteticos001.php",
        description: "Balanço patrimonial e DRE sintéticos",
        params: ["papel", "data_ini", "data_fim", "trailing", "c_c", "m_m", "periodicidade", "template"]
    },
    HistoricoIndicadoresFundamentalistas001: {
        url: "HistoricoIndicadoresFundamentalistas001.php",
        description: "Série histórica de indicadores fundamentalistas",
        params: ["papel", "data_ini", "data_fim", "indic", "periodicidade", "trailing"]
    },
    Fundamentalista3: {
        url: "Fundamentalista3",
        description: "Dados fundamentalistas completos de empresa",
        params: ["ticker", "tipo_dados"]
    },
    InsiderTrading001: {
        url: "InsiderTrading001.php",
        description: "Movimentações de insiders",
        params: ["papel", "mes", "orgaos", "oper", "consolidado"]
    },
    BuscaComunicados001: {
        url: "BuscaComunicados001",
        description: "Busca de comunicados oficiais",
        params: ["tipo", "data_ini", "data_fim", "paginacao"]
    },
    Comunicados001: {
        url: "Comunicados001",
        description: "Histórico de comunicados de ativo específico",
        params: ["ticker", "data_ini", "data_fim", "tipo_evento"]
    },
    HistoricoProventos: {
        url: "HistoricoProventos",
        description: "Histórico de dividendos e JCP",
        params: ["ticker", "data_ini", "data_fim", "tipo_provento"]
    },
    HistoricoProventos002: {
        url: "HistoricoProventos002.php",
        description: "Proventos com mais tipos",
        params: ["x", "data_ini", "data_fim", "tipo_provento", "num_casas"]
    },
    HistoricoValorMercado001: {
        url: "HistoricoValorMercado001",
        description: "Série histórica de capitalização de mercado",
        params: ["ticker", "data_ini", "data_fim"]
    },
    // Cotações, Benchmarks e Derivativos
    HistoricoCotacao002: {
        url: "HistoricoCotacao002.php",
        description: "Série histórica de cotações de ativos e índices",
        params: ["x", "data_ini", "data_fim", "info_desejada", "retorno", "tipo_ajuste", "rent_acum", "base_num_indice"]
    },
    HistoricoCotacaoAcao001: {
        url: "HistoricoCotacaoAcao001",
        description: "Histórico de cotações ajustadas de ações",
        params: ["ticker", "data_ini", "data_fim", "tipo_ajuste"]
    },
    HistoricoCotacaoBMF: {
        url: "HistoricoCotacaoBMF",
        description: "Histórico de contratos futuros BM&F",
        params: ["contrato", "data_ini", "data_fim", "n_periodos"]
    },
    HistoricoCotacaoOpcaoSobreAcao001: {
        url: "HistoricoCotacaoOpcaoSobreAcao001.php",
        description: "Histórico de opções sobre ações",
        params: ["x", "data_ini", "data_fim", "data_vencimento", "indicadores"]
    },
    HistoricoAluguelAcao001: {
        url: "HistoricoAluguelAcao001",
        description: "Histórico de taxas de aluguel de ações",
        params: ["ticker", "data_ini", "data_fim", "flag"]
    },
    ResumoCotacaoValoresVolumes001: {
        url: "ResumoCotacaoValoresVolumes001",
        description: "Resumo de cotações e volumes negociados",
        params: ["data_ini", "qtd_periodos", "tickers"]
    },
    AcumuleTaxa001: {
        url: "AcumuleTaxa001",
        description: "Acumulação de taxas de referência",
        params: ["taxa", "data_ini", "data_fim"]
    },
    ComposicaoIndices001: {
        url: "ComposicaoIndices001.php",
        description: "Composição de índice de mercado",
        params: ["data_analise", "indice", "tipo_portfolio"]
    },
    // Utilitários
    Buscador001: {
        url: "Buscador001",
        description: "Busca de ativo por nome ou código",
        params: ["nome", "tipo_busca"]
    },
    Buscador002: {
        url: "Buscador002",
        description: "Busca por código de ativo",
        params: ["codigo", "flags"]
    },
    BuscaComunicados001_Util: {
        url: "BuscaComunicados001",
        description: "Busca centralizada de comunicados",
        params: ["tipo", "data_ini", "data_fim", "paginacao"]
    },
    CentralAtualizacoes001: {
        url: "CentralAtualizacoes001.php",
        description: "Central de atualizações de dados",
        params: ["tabelas", "campos", "data_ini"]
    },
    ListarAtivos001: {
        url: "ListarAtivos001",
        description: "Listagem de ativos disponíveis",
        params: ["tipo_ativo", "qtd"]
    }
};
//# sourceMappingURL=endpoints.js.map