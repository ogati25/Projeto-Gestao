namespace Projeto_Gestao.DTOs;

// Totais gerais
public record TotaisDto(
    long Total,
    long Computadores,
    long Monitores,
    long Celulares);

// Itens em manutenção
public record ManutencaoDto(
    long Total,
    long Computadores,
    long Monitores,
    long Celulares);

// Um item na tabela de críticos
public record ItemCriticoDto(
    string Id,
    string Nome,
    string SKU,
    string Categoria,
    string Status,
    bool   Ativo);

// A lista de críticos
public record ItensCriticosDto(IReadOnlyList<ItemCriticoDto> Itens);

// Uma atividade recente
public record AtividadeDto(
    string   Id,
    string   Nome,
    string   Categoria,
    DateTime DataAquisicao,
    string   Status,
    string   Usuario);

// A lista de atividades
public record AtividadesDto(IReadOnlyList<AtividadeDto> Atividades);

// Uma fatia do gráfico pizza
public record CategoriaDistribuicaoDto(
    string Nome,
    long   Quantidade,
    double Percentual);

// O gráfico pizza inteiro
public record DistribuicaoDto(IReadOnlyList<CategoriaDistribuicaoDto> Categorias);

// Uma barra do gráfico ativos/inativos
public record CategoriaOcupacaoDto(
    string Nome,
    long   Ativos,
    long   Inativos,
    long   Total,
    double Percentual);

// O gráfico inteiro
public record OcupacaoDto(IReadOnlyList<CategoriaOcupacaoDto> Categorias);

// O resumo completo — agrupa tudo
public record ResumoDto(
    TotaisDto       Totais,
    ManutencaoDto   Manutencao,
    DistribuicaoDto Distribuicao,
    OcupacaoDto     Ocupacao,
    ItensCriticosDto ItensCriticos,
    AtividadesDto   Atividades);