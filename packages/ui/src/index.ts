import './base.css'

/**
 * A porta de entrada da biblioteca.
 *
 * Agrupado por PAPEL, não por ordem alfabética: quem chega procurando "como mostro um
 * erro" acha a família inteira de uma vez, em vez de caçar `Alerta` entre `Abas` e
 * `AreaTexto`. Mesma lógica do menu da documentação.
 *
 * Nomes em português de propósito — os dois produtos que a biblioteca serve são escritos
 * em português, e `<Caixa>` ao lado de `<Cliente>` lê melhor que `<Checkbox>`. Os tipos
 * saem junto do componente: quem importa `Button` quer `ButtonProps` na mesma linha.
 */

// ── Ação ─────────────────────────────────────────────────────────────────────
export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button'

export { Menu, ItemMenu, SeparadorMenu, RotuloMenu } from './components/Menu'
export type { MenuProps, ItemMenuProps, MenuAlinhamento } from './components/Menu'

// ── Formulário ───────────────────────────────────────────────────────────────
// CampoForm vem primeiro porque é ele que amarra label, ajuda e erro ao controle. Sem
// ele o leitor de tela anuncia "campo de edição" sem dizer qual nem o que deu errado.
export { CampoForm } from './components/CampoForm'
export type { CampoFormProps, FiacaoCampo } from './components/CampoForm'

export { Campo } from './components/Campo'
export type { CampoProps, CampoSize } from './components/Campo'

export { AreaTexto } from './components/AreaTexto'
export type { AreaTextoProps } from './components/AreaTexto'

export { Selecao } from './components/Selecao'
export type { SelecaoProps, OpcaoSelecao, SelecaoRef, SelecaoSize } from './components/Selecao'

// Autocomplete e Selecao NÃO são o mesmo componente com nomes diferentes. `Selecao` é
// lista fechada e curta (a integração, o estado); `Autocomplete` é lista grande ou que vem
// do servidor (o cliente, entre 5 mil). Trocar os dois é o erro de uso mais provável
// desta família — está no JSDoc dos dois.
export { Autocomplete } from './components/Autocomplete'
export type { AutocompleteProps, OpcaoAutocomplete, AutocompleteSize } from './components/Autocomplete'

export { CampoData, analisarData, formatarData } from './components/CampoData'
export type { CampoDataProps, FormatoData } from './components/CampoData'

// `ATALHOS_PADRAO` é valor, não tipo: sem ele exportado, quem quiser acrescentar um
// atalho (`atalhos={[...ATALHOS_PADRAO, meuAtalho]}`) teria que redigitar os cinco — e
// aí "Este mês" do produto começa a divergir do "Este mês" da biblioteca.
export { CampoPeriodo, ATALHOS_PADRAO } from './components/CampoPeriodo'
export type { CampoPeriodoProps, Periodo, AtalhoPeriodo } from './components/CampoPeriodo'

// A grade solta, para quem quer o calendário embutido na tela em vez de num painel.
export { Calendario } from './components/Calendario'
export type { CalendarioProps, IntervaloDatas, SetasCalendario } from './components/Calendario'

// Data é campo minado (fuso, horário de verão, mês com 28-31 dias). Estas funções são o
// que os componentes de data usam por dentro; saem exportadas porque quem monta um filtro
// de período vai precisar delas, e reimplementar `somarMeses` na mão é como se cria o bug
// do "31 de janeiro + 1 mês = 3 de março".
export {
  criarData, inicioDoDia, mesmoDia, mesmoMes, compararDias, somarDias, diasNoMes,
  somarMeses, inicioDoMes,
} from './components/Calendario'

export { CampoArquivo } from './components/CampoArquivo'
export type { CampoArquivoProps } from './components/CampoArquivo'

export { Deslizador } from './components/Deslizador'
export type { DeslizadorProps, DeslizadorRef, MarcaDeslizador, DeslizadorSize } from './components/Deslizador'

export { Caixa } from './components/Caixa'
export type { CaixaProps } from './components/Caixa'

export { Radio, GrupoRadio } from './components/Radio'
export type { RadioProps, GrupoRadioProps, OrientacaoGrupoRadio } from './components/Radio'

export { Interruptor } from './components/Interruptor'
export type { InterruptorProps, InterruptorSize } from './components/Interruptor'

// ── Superfície e dados ───────────────────────────────────────────────────────
export { Card, CardHeader, CardBody, CardFooter } from './components/Card'
export type { CardProps, CardHeaderProps, CardBodyProps, CardElevation } from './components/Card'

export { StatCard } from './components/StatCard'
export type { StatCardProps, StatTone, StatDelta } from './components/StatCard'

export { Tabela } from './components/Tabela'
export type { TabelaProps, Coluna, Ordem, Direcao, Alinhamento, ChaveDeLinha } from './components/Tabela'

export { EstadoVazio } from './components/EstadoVazio'
export type { EstadoVazioProps, EstadoVazioSize } from './components/EstadoVazio'

// ── Identidade e status ──────────────────────────────────────────────────────
// Selo é ESTADO (você lê: "Entregue"). Etiqueta é ENTRADA (você criou e pode remover:
// um filtro). Trocar os dois é o erro de uso mais comum da dupla — está no JSDoc.
export { Selo } from './components/Selo'
export type { SeloProps, SeloTom, SeloVariante, SeloSize } from './components/Selo'

export { Etiqueta } from './components/Etiqueta'
export type { EtiquetaProps, EtiquetaTom, EtiquetaSize } from './components/Etiqueta'

export { Avatar, GrupoAvatar, iniciaisDoNome, tomDoNome } from './components/Avatar'
export type {
  AvatarProps, GrupoAvatarProps, AvatarSize, AvatarFormato, AvatarStatus, AvatarTom,
} from './components/Avatar'

// ── Retorno ao usuário ───────────────────────────────────────────────────────
export { Alerta } from './components/Alerta'
export type { AlertaProps, AlertaTom } from './components/Alerta'

export { ProvedorAvisos, useAviso } from './components/Aviso'
export type { AvisoOpcoes, AvisoTom, AvisoAcao, ApiAvisos, ProvedorAvisosProps } from './components/Aviso'

export { Giro } from './components/Giro'
export type { GiroProps, GiroSize } from './components/Giro'

export { Progresso } from './components/Progresso'
export type { ProgressoProps, ProgressoTom, ProgressoSize } from './components/Progresso'

export { Esqueleto } from './components/Esqueleto'
export type { EsqueletoProps, EsqueletoVariante } from './components/Esqueleto'

// ── Sobreposição ─────────────────────────────────────────────────────────────
export { Dialogo } from './components/Dialogo'
export type { DialogoProps, DialogoSize } from './components/Dialogo'

export { Gaveta } from './components/Gaveta'
export type { GavetaProps, GavetaLado } from './components/Gaveta'

export { Dica } from './components/Dica'
export type { DicaProps, DicaLado } from './components/Dica'

// A terceira sobreposição, e a distinção importa: `Dica` é texto curto no hover e NÃO
// recebe foco; `Menu` é lista de ações; `Popover` é o painel com conteúdo INTERATIVO
// dentro (um filtro, um mini-formulário). Só o Popover precisa prender o Tab.
export { Popover } from './components/Popover'
export type { PopoverProps, PopoverLado, PopoverAlinhamento } from './components/Popover'

// ── Navegação ────────────────────────────────────────────────────────────────
export { Abas, ListaAbas, Aba, PainelAba } from './components/Abas'
export type { AbasProps, ListaAbasProps, AbaProps, PainelAbaProps, VarianteAbas } from './components/Abas'

export { Acordeao, ItemAcordeao } from './components/Acordeao'
export type { AcordeaoProps, ItemAcordeaoProps, TipoAcordeao } from './components/Acordeao'

export { Trilha, ItemTrilha } from './components/Trilha'
export type { TrilhaProps, ItemTrilhaProps } from './components/Trilha'

export { Passos } from './components/Passos'
export type { PassosProps, Passo, EstadoPasso, PassosOrientacao } from './components/Passos'

export { LinhaDoTempo } from './components/LinhaDoTempo'
export type {
  LinhaDoTempoProps, ItemLinhaDoTempo, LinhaDoTempoTom, LinhaDoTempoOrientacao,
} from './components/LinhaDoTempo'

// `janelaPaginas` sai exportada porque é onde mora todo o risco da paginação (a lógica
// de reticências), é pura, e quem montar uma paginação própria merece reusá-la testada.
export { Paginacao, janelaPaginas } from './components/Paginacao'
export type { PaginacaoProps, ItemPagina } from './components/Paginacao'

// ── Miúdos ───────────────────────────────────────────────────────────────────
// Pequenos e sem graça, e é justamente por isso que precisam existir aqui: sem eles, cada
// tela desenha a própria linha divisória e a própria tecla com uma <div> e uma classe
// solta — que é a origem exata do problema que esta biblioteca existe para resolver.
export { Divisor } from './components/Divisor'
export type { DivisorProps, DivisorOrientacao, DivisorEspessura } from './components/Divisor'

export { Tecla } from './components/Tecla'
export type { TeclaProps } from './components/Tecla'

// ── Utilitário ───────────────────────────────────────────────────────────────
export { cx } from './utils/cx'
