// Services/RelatorioService.cs
using ClosedXML.Excel;
using MongoDB.Driver;
using Projeto_Gestao.DTOs;
using Projeto_Gestao.Models;
using Projeto_Gestao.Settings;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Computador = Projeto_Gestao.Models.Computador;
using Monitor = Projeto_Gestao.Models.Monitor;
using Celular = Projeto_Gestao.Models.Celular;

namespace Projeto_Gestao.Services;

public class RelatorioService
{
    private readonly IMongoCollection<Computador> _computadores;
    private readonly IMongoCollection<Monitor> _monitores;
    private readonly IMongoCollection<Celular> _celulares;

    // Status que representam manutenção — mesmo padrão do DashboardService
    private static readonly string[] StatusManutencao = ["EmManutenção", "NecessitaManutenção"];

    public RelatorioService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var database = client.GetDatabase(settings.Value.DatabaseName);
        _computadores = database.GetCollection<Computador>("Computadores");
        _monitores = database.GetCollection<Monitor>("Monitores");
        _celulares = database.GetCollection<Celular>("Celulares");

        // Licença comunitária do QuestPDF (gratuita para projetos não comerciais)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BUSCA E MONTAGEM DOS DADOS
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<RelatorioResultadoDto> GerarResultadoAsync(RelatorioFiltroDto filtro)
    {
        // Monta filtros de data para cada coleção
        var (filtroComp, filtroMon, filtroCel) = MontarFiltrosDatas(filtro);

        // Busca em paralelo
        var (computadores, monitores, celulares) = await (
            _computadores.Find(filtroComp).ToListAsync(),
            _monitores.Find(filtroMon).ToListAsync(),
            _celulares.Find(filtroCel).ToListAsync()
        ).WhenAll();

        // Normaliza para lista única
        var itens = new List<RelatorioItemDto>();

        itens.AddRange(computadores.Select(c => new RelatorioItemDto
        {
            Id = c.Id ?? string.Empty,
            Categoria = "Computador",
            Modelo = c.Modelo,
            Codigo = c.Codigo,
            Usuario = c.Usuario,
            Setor = c.Setor,
            Status = c.Status,
            Ativo = c.Ativo,
            DataAquisicao = c.DataAquisicao,
            PrecoAquisicao = c.PrecoAquisicao,
            Observacoes = c.Observacoes,
            Detalhes = $"RAM: {c.MemoriaRAMTotal}GB | SO: {c.SistemaOperacional} | IP: {c.IP}"
        }));

        itens.AddRange(monitores.Select(m => new RelatorioItemDto
        {
            Id = m.Id ?? string.Empty,
            Categoria = "Monitor",
            Modelo = m.Modelo,
            Codigo = m.Codigo,
            Usuario = m.Usuario,
            Setor = m.Setor,
            Status = m.Status,
            Ativo = m.Ativo,
            DataAquisicao = m.DataAquisicao,
            PrecoAquisicao = m.PrecoAquisicao,
            Observacoes = m.Observacoes,
            Detalhes = $"{m.Tamanho}\" | {m.Resolucao} | {m.Frequencia}Hz"
        }));

        itens.AddRange(celulares.Select(c => new RelatorioItemDto
        {
            Id = c.Id ?? string.Empty,
            Categoria = "Celular",
            Modelo = c.Modelo,
            Codigo = c.Codigo,
            Usuario = c.Usuario,
            Setor = c.Setor,
            Status = c.Status,
            Ativo = c.Ativo,
            DataAquisicao = c.DataAquisicao,
            PrecoAquisicao = c.PrecoAquisicao,
            Observacoes = c.Observacoes,
            Detalhes = $"RAM: {c.MemoriaRAM}GB | Armazenamento: {c.Armazenamento}GB | {c.Conectividade}"
        }));

        // Ordena por categoria e depois por modelo
        itens = itens.OrderBy(i => i.Categoria).ThenBy(i => i.Modelo).ToList();

        return new RelatorioResultadoDto
        {
            GeradoEm = DateTime.Now,
            PeriodoInicio = filtro.DataInicio,
            PeriodoFim = filtro.DataFim,
            TotalItens = itens.Count,
            TotalAtivos = itens.Count(i => i.Ativo),
            TotalInativos = itens.Count(i => !i.Ativo),
            TotalEmManutencao = itens.Count(i => StatusManutencao.Contains(i.Status)),
            TotalComputadores = itens.Count(i => i.Categoria == "Computador"),
            TotalMonitores = itens.Count(i => i.Categoria == "Monitor"),
            TotalCelulares = itens.Count(i => i.Categoria == "Celular"),
            ValorTotalEstoque = itens.Sum(i => i.PrecoAquisicao),
            Itens = itens
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GERAÇÃO DE PDF (QuestPDF)
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<byte[]> GerarPdfAsync(RelatorioFiltroDto filtro)
    {
        var resultado = await GerarResultadoAsync(filtro);
        return GerarPdfBytes(resultado);
    }

    private static byte[] GerarPdfBytes(RelatorioResultadoDto resultado)
    {
        // Cores do design system do projeto
        var corPrimaria = "#4f6ef7";
        var corCinzaEsc = "#1e2333";
        var corTexto = "#e8eaf2";
        var corSubtexto = "#8b90a8";
        var corBorda = "#2a2f45";
        var corVerde = "#34d399";
        var corAmbar = "#fbbf24";
        var corVermelho = "#f87171";

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(9).FontColor("#e8eaf2"));

                // ── Cabeçalho ──────────────────────────────────────────────
                page.Header().Element(header =>
                {
                    header.Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("RELATÓRIO DE ATIVOS")
                               .Bold().FontSize(16).FontColor(corPrimaria);

                            col.Item().Text($"Gerado em: {resultado.GeradoEm:dd/MM/yyyy HH:mm}")
                               .FontSize(8).FontColor(corSubtexto);

                            if (resultado.PeriodoInicio.HasValue || resultado.PeriodoFim.HasValue)
                            {
                                var periodo = $"Período: {resultado.PeriodoInicio?.ToString("dd/MM/yyyy") ?? "—"}" +
                                              $" até {resultado.PeriodoFim?.ToString("dd/MM/yyyy") ?? "—"}";
                                col.Item().Text(periodo).FontSize(8).FontColor(corSubtexto);
                            }
                        });

                        // Cards de totalizadores no cabeçalho
                        row.ConstantItem(420).Row(cards =>
                        {
                            void Card(RowDescriptor r, string label, string valor, string cor)
                            {
                                r.RelativeItem().Border(1).BorderColor(corBorda)
                                 .Background(corCinzaEsc).Padding(8).Column(c =>
                                 {
                                     c.Item().Text(valor).Bold().FontSize(14).FontColor(cor);
                                     c.Item().Text(label).FontSize(7).FontColor(corSubtexto);
                                 });
                            }

                            Card(cards, "Total de Itens", resultado.TotalItens.ToString(), corPrimaria);
                            Card(cards, "Ativos", resultado.TotalAtivos.ToString(), corVerde);
                            Card(cards, "Inativos", resultado.TotalInativos.ToString(), corSubtexto);
                            Card(cards, "Em Manutenção", resultado.TotalEmManutencao.ToString(), corAmbar);
                            Card(cards, "Valor Total",
                                $"R$ {resultado.ValorTotalEstoque:N2}", corVerde);
                        });
                    });
                });

                // ── Resumo por categoria ────────────────────────────────────
                page.Content().Column(col =>
                {
                    col.Item().PaddingTop(12).Row(resumo =>
                    {
                        void CatCard(RowDescriptor r, string nome, int total, string cor)
                        {
                            r.RelativeItem().Border(1).BorderColor(corBorda)
                             .Background(corCinzaEsc).Padding(8).Column(c =>
                             {
                                 c.Item().Text(nome).FontSize(8).FontColor(corSubtexto);
                                 c.Item().Text(total.ToString()).Bold().FontSize(20).FontColor(cor);
                                 c.Item().Text("equipamentos").FontSize(7).FontColor(corSubtexto);
                             });
                        }

                        CatCard(resumo, "Computadores", resultado.TotalComputadores, corPrimaria);
                        CatCard(resumo, "Monitores", resultado.TotalMonitores, "#a78bfa");
                        CatCard(resumo, "Celulares", resultado.TotalCelulares, corAmbar);
                    });

                    // ── Tabela principal ────────────────────────────────────
                    col.Item().PaddingTop(16).Table(tabela =>
                    {
                        // Definição das colunas
                        tabela.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(30);   // #
                            cols.RelativeColumn(2);    // Modelo
                            cols.RelativeColumn(1.2f); // Código
                            cols.RelativeColumn(1);    // Categoria
                            cols.RelativeColumn(1.5f); // Usuário
                            cols.RelativeColumn(1);    // Setor
                            cols.RelativeColumn(1);    // Status
                            cols.ConstantColumn(45);   // Ativo
                            cols.RelativeColumn(1);    // Aquisição
                            cols.RelativeColumn(1.2f); // Preço
                            cols.RelativeColumn(2.5f); // Detalhes
                        });

                        // Cabeçalho da tabela
                        static IContainer CabecalhoCell(IContainer c) =>
                            c.Background("#2a2f45").Padding(5).AlignMiddle();

                        string[] headers = ["#", "Modelo", "Código", "Categoria",
                                            "Usuário", "Setor", "Status", "Ativo",
                                            "Aquisição", "Preço (R$)", "Detalhes"];

                        tabela.Header(th =>
                            {
                                foreach (var h in headers)
                                {
                                    th.Cell().Element(CabecalhoCell)
                                    .Text(h).Bold().FontSize(8).FontColor("#e8eaf2");
                                }
                            });

                        // Linhas de dados
                        for (int i = 0; i < resultado.Itens.Count; i++)
                        {
                            var item = resultado.Itens[i];
                            var bgLinha = i % 2 == 0 ? "#181c27" : "#1e2333";

                            IContainer Cell(IContainer c) =>
                                c.Background(bgLinha).BorderBottom(1).BorderColor(corBorda)
                                 .PaddingVertical(5).PaddingHorizontal(5).AlignMiddle();

                            // Cor do status
                            var corStatus = item.Status switch
                            {
                                "EmManutenção" => corAmbar,
                                "NecessitaManutenção" => corVermelho,
                                "Ativo" => corVerde,
                                _ => corSubtexto
                            };

                            tabela.Cell().Element(Cell).Text($"{i + 1}").FontSize(8).FontColor(corSubtexto);
                            tabela.Cell().Element(Cell).Text(item.Modelo).FontSize(8);
                            tabela.Cell().Element(Cell).Text(item.Codigo).FontSize(7).FontColor(corSubtexto);
                            tabela.Cell().Element(Cell).Text(item.Categoria).FontSize(8).FontColor(corPrimaria);
                            tabela.Cell().Element(Cell).Text(item.Usuario).FontSize(8);
                            tabela.Cell().Element(Cell).Text(item.Setor).FontSize(8);
                            tabela.Cell().Element(Cell).Text(item.Status).FontSize(8).FontColor(corStatus);
                            tabela.Cell().Element(Cell).Text(item.Ativo ? "Sim" : "Não")
                                  .FontSize(8).FontColor(item.Ativo ? corVerde : corVermelho);
                            tabela.Cell().Element(Cell).Text(item.DataAquisicao.ToString("dd/MM/yyyy")).FontSize(8);
                            tabela.Cell().Element(Cell).Text($"R$ {item.PrecoAquisicao:N2}").FontSize(8);
                            tabela.Cell().Element(Cell).Text(item.Detalhes ?? "—").FontSize(7).FontColor(corSubtexto);
                        }
                    });

                    // Rodapé da tabela
                    col.Item().PaddingTop(4).AlignRight()
                       .Text($"Total: {resultado.TotalItens} item(ns) | " +
                             $"Valor total: R$ {resultado.ValorTotalEstoque:N2}")
                       .FontSize(8).FontColor(corSubtexto);
                });

                // ── Rodapé da página ───────────────────────────────────────
                page.Footer().AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Página ").FontSize(8).FontColor(corSubtexto);
                        x.CurrentPageNumber().FontSize(8).FontColor(corSubtexto);
                        x.Span(" de ").FontSize(8).FontColor(corSubtexto);
                        x.TotalPages().FontSize(8).FontColor(corSubtexto);
                        x.Span(" — Projeto Gestão de Ativos").FontSize(8).FontColor(corSubtexto);
                    });
            });
        })
        .GeneratePdf();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. GERAÇÃO DE EXCEL (ClosedXML)
    // ─────────────────────────────────────────────────────────────────────────

    public async Task<byte[]> GerarExcelAsync(RelatorioFiltroDto filtro)
    {
        var resultado = await GerarResultadoAsync(filtro);
        return GerarExcelBytes(resultado);
    }

    private static byte[] GerarExcelBytes(RelatorioResultadoDto resultado)
    {
        using var workbook = new XLWorkbook();

        // ── Aba 1: Todos os itens ─────────────────────────────────────────
        var ws = workbook.Worksheets.Add("Inventário Completo");

        // Título
        ws.Cell("A1").Value = "RELATÓRIO DE ATIVOS — GESTÃO DE EQUIPAMENTOS";
        ws.Range("A1:K1").Merge().Style
            .Font.SetBold(true).Font.SetFontSize(14)
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1e2333"))
            .Font.SetFontColor(XLColor.FromHtml("#4f6ef7"))
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        ws.Cell("A2").Value = $"Gerado em: {resultado.GeradoEm:dd/MM/yyyy HH:mm}";
        if (resultado.PeriodoInicio.HasValue || resultado.PeriodoFim.HasValue)
        {
            ws.Cell("B2").Value = $"Período: {resultado.PeriodoInicio?.ToString("dd/MM/yyyy") ?? "—"} " +
                                  $"até {resultado.PeriodoFim?.ToString("dd/MM/yyyy") ?? "—"}";
        }
        ws.Range("A2:K2").Style
            .Font.SetFontColor(XLColor.FromHtml("#8b90a8"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#181c27"));

        // Cards de resumo (linha 4)
        var resumos = new[]
        {
            ("Total de Itens",    resultado.TotalItens.ToString(),        "#4f6ef7"),
            ("Ativos",            resultado.TotalAtivos.ToString(),       "#34d399"),
            ("Inativos",          resultado.TotalInativos.ToString(),     "#8b90a8"),
            ("Em Manutenção",     resultado.TotalEmManutencao.ToString(), "#fbbf24"),
            ("Computadores",      resultado.TotalComputadores.ToString(), "#4f6ef7"),
            ("Monitores",         resultado.TotalMonitores.ToString(),    "#a78bfa"),
            ("Celulares",         resultado.TotalCelulares.ToString(),    "#fbbf24"),
            ("Valor Total (R$)",  resultado.ValorTotalEstoque.ToString("N2"), "#34d399"),
        };

        for (int i = 0; i < resumos.Length; i++)
        {
            var (label, valor, cor) = resumos[i];
            var col = (char)('A' + i);
            ws.Cell($"{col}4").Value = label;
            ws.Cell($"{col}4").Style
                .Font.SetFontSize(8).Font.SetFontColor(XLColor.FromHtml("#8b90a8"))
                .Fill.SetBackgroundColor(XLColor.FromHtml("#1e2333"))
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            ws.Cell($"{col}5").Value = valor;
            ws.Cell($"{col}5").Style
                .Font.SetBold(true).Font.SetFontSize(13)
                .Font.SetFontColor(XLColor.FromHtml(cor))
                .Fill.SetBackgroundColor(XLColor.FromHtml("#1e2333"))
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
        }
        ws.Range("A4:H5").Style.Border.SetOutsideBorder(XLBorderStyleValues.Thin)
            .Border.SetOutsideBorderColor(XLColor.FromHtml("#2a2f45"));

        // Cabeçalho da tabela (linha 7)
        var colunas = new[]
        {
            "#", "Modelo", "Código", "Categoria", "Usuário",
            "Setor", "Status", "Ativo", "Data Aquisição", "Preço (R$)", "Detalhes"
        };

        for (int c = 0; c < colunas.Length; c++)
        {
            var cell = ws.Cell(7, c + 1);
            cell.Value = colunas[c];
            cell.Style
                .Font.SetBold(true).Font.SetFontSize(9)
                .Font.SetFontColor(XLColor.FromHtml("#e8eaf2"))
                .Fill.SetBackgroundColor(XLColor.FromHtml("#2a2f45"))
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Border.SetBottomBorder(XLBorderStyleValues.Medium)
                .Border.SetBottomBorderColor(XLColor.FromHtml("#4f6ef7"));
        }

        // Linhas de dados (a partir da linha 8)
        for (int i = 0; i < resultado.Itens.Count; i++)
        {
            var item = resultado.Itens[i];
            var linha = i + 8;
            var bgHex = i % 2 == 0 ? "#181c27" : "#1e2333";
            var bg = XLColor.FromHtml(bgHex);
            var fg = XLColor.FromHtml("#e8eaf2");

            var corStatus = item.Status switch
            {
                "EmManutenção" => XLColor.FromHtml("#fbbf24"),
                "NecessitaManutenção" => XLColor.FromHtml("#f87171"),
                "Ativo" => XLColor.FromHtml("#34d399"),
                _ => XLColor.FromHtml("#8b90a8")
            };

            void SetCell(int col, object valor, XLColor? fontColor = null, bool bold = false)
            {
                var cell = ws.Cell(linha, col);
                cell.Value = valor?.ToString() ?? "—";
                cell.Style
                    .Font.SetFontColor(fontColor ?? fg)
                    .Font.SetBold(bold)
                    .Fill.SetBackgroundColor(bg)
                    .Border.SetBottomBorder(XLBorderStyleValues.Thin)
                    .Border.SetBottomBorderColor(XLColor.FromHtml("#2a2f45"));
            }

            SetCell(1, i + 1, XLColor.FromHtml("#8b90a8"));
            SetCell(2, item.Modelo, bold: true);
            SetCell(3, item.Codigo, XLColor.FromHtml("#8b90a8"));
            SetCell(4, item.Categoria, XLColor.FromHtml("#4f6ef7"));
            SetCell(5, item.Usuario);
            SetCell(6, item.Setor);
            SetCell(7, item.Status, corStatus);
            SetCell(8, item.Ativo ? "Sim" : "Não",
                        item.Ativo ? XLColor.FromHtml("#34d399") : XLColor.FromHtml("#f87171"));
            SetCell(9, item.DataAquisicao.ToString("dd/MM/yyyy"));
            SetCell(10, item.PrecoAquisicao.ToString("N2"));
            SetCell(11, item.Detalhes ?? "—", XLColor.FromHtml("#8b90a8"));
        }

        // Linha de totais
        var linhaTotais = resultado.Itens.Count + 8;
        ws.Cell(linhaTotais, 1).Value = "TOTAL";
        ws.Cell(linhaTotais, 10).Value = resultado.ValorTotalEstoque.ToString("N2");
        ws.Range(linhaTotais, 1, linhaTotais, 11).Style
            .Font.SetBold(true).Font.SetFontSize(9)
            .Font.SetFontColor(XLColor.FromHtml("#e8eaf2"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#2a2f45"))
            .Border.SetTopBorder(XLBorderStyleValues.Medium)
            .Border.SetTopBorderColor(XLColor.FromHtml("#4f6ef7"));

        // Ajuste automático das colunas
        ws.Columns().AdjustToContents();
        ws.Column(11).Width = 40; // Detalhes — largura fixa

        // Congela cabeçalho
        ws.SheetView.Freeze(7, 0);

        // ── Aba 2: Resumo por categoria ────────────────────────────────────
        var wsResumo = workbook.Worksheets.Add("Resumo");

        wsResumo.Cell("A1").Value = "RESUMO POR CATEGORIA";
        wsResumo.Range("A1:D1").Merge().Style
            .Font.SetBold(true).Font.SetFontSize(13)
            .Font.SetFontColor(XLColor.FromHtml("#4f6ef7"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#1e2333"))
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

        var resumoHeaders = new[] { "Categoria", "Total", "Ativos", "Inativos", "Em Manutenção", "Valor Total (R$)" };
        for (int c = 0; c < resumoHeaders.Length; c++)
        {
            wsResumo.Cell(3, c + 1).Value = resumoHeaders[c];
            wsResumo.Cell(3, c + 1).Style
                .Font.SetBold(true).Font.SetFontColor(XLColor.FromHtml("#e8eaf2"))
                .Fill.SetBackgroundColor(XLColor.FromHtml("#2a2f45"));
        }

        var categorias = new[] { "Computador", "Monitor", "Celular" };
        var coresCat = new[] { "#4f6ef7", "#a78bfa", "#fbbf24" };

        for (int i = 0; i < categorias.Length; i++)
        {
            var cat = categorias[i];
            var linha = 4 + i;
            var itensCat = resultado.Itens.Where(x => x.Categoria == cat).ToList();

            wsResumo.Cell(linha, 1).Value = cat + "s";
            wsResumo.Cell(linha, 2).Value = itensCat.Count;
            wsResumo.Cell(linha, 3).Value = itensCat.Count(x => x.Ativo);
            wsResumo.Cell(linha, 4).Value = itensCat.Count(x => !x.Ativo);
            wsResumo.Cell(linha, 5).Value = itensCat.Count(x => StatusManutencao.Contains(x.Status));
            wsResumo.Cell(linha, 6).Value = itensCat.Sum(x => x.PrecoAquisicao).ToString("N2");

            wsResumo.Range(linha, 1, linha, 6).Style
                .Font.SetFontColor(XLColor.FromHtml("#e8eaf2"))
                .Fill.SetBackgroundColor(XLColor.FromHtml(i % 2 == 0 ? "#181c27" : "#1e2333"));
            wsResumo.Cell(linha, 1).Style.Font.SetFontColor(XLColor.FromHtml(coresCat[i]));
        }

        // Total geral
        wsResumo.Cell(7, 1).Value = "TOTAL GERAL";
        wsResumo.Cell(7, 2).Value = resultado.TotalItens;
        wsResumo.Cell(7, 3).Value = resultado.TotalAtivos;
        wsResumo.Cell(7, 4).Value = resultado.TotalInativos;
        wsResumo.Cell(7, 5).Value = resultado.TotalEmManutencao;
        wsResumo.Cell(7, 6).Value = resultado.ValorTotalEstoque.ToString("N2");
        wsResumo.Range("A7:F7").Style
            .Font.SetBold(true).Font.SetFontColor(XLColor.FromHtml("#4f6ef7"))
            .Fill.SetBackgroundColor(XLColor.FromHtml("#2a2f45"));

        wsResumo.Columns().AdjustToContents();

        // Serializa para bytes
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. HELPER — FILTROS DE DATA
    // ─────────────────────────────────────────────────────────────────────────

    private static (FilterDefinition<Computador>, FilterDefinition<Monitor>, FilterDefinition<Celular>)
        MontarFiltrosDatas(RelatorioFiltroDto filtro)
    {
        // Sem filtro de data → traz tudo
        if (!filtro.DataInicio.HasValue && !filtro.DataFim.HasValue)
        {
            return (
                Builders<Computador>.Filter.Empty,
                Builders<Monitor>.Filter.Empty,
                Builders<Celular>.Filter.Empty
            );
        }

        var inicio = filtro.DataInicio ?? DateTime.MinValue;
        var fim = (filtro.DataFim ?? DateTime.MaxValue).AddDays(1).AddTicks(-1); // fim do dia

        var fc = Builders<Computador>.Filter.And(
            Builders<Computador>.Filter.Gte(c => c.DataAquisicao, inicio),
            Builders<Computador>.Filter.Lte(c => c.DataAquisicao, fim));

        var fm = Builders<Monitor>.Filter.And(
            Builders<Monitor>.Filter.Gte(m => m.DataAquisicao, inicio),
            Builders<Monitor>.Filter.Lte(m => m.DataAquisicao, fim));

        var fcel = Builders<Celular>.Filter.And(
            Builders<Celular>.Filter.Gte(c => c.DataAquisicao, inicio),
            Builders<Celular>.Filter.Lte(c => c.DataAquisicao, fim));

        return (fc, fm, fcel);
    }
}

// Extensão para desconstruir Task.WhenAll com tupla (mantém consistência com DashboardService)
file static class TaskExtensions
{
    public static async Task<(T1, T2, T3)> WhenAll<T1, T2, T3>(
        this (Task<T1> t1, Task<T2> t2, Task<T3> t3) tasks)
    {
        await Task.WhenAll(tasks.t1, tasks.t2, tasks.t3);
        return (tasks.t1.Result, tasks.t2.Result, tasks.t3.Result);
    }
}