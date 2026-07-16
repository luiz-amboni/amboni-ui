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

// ── Navegação ────────────────────────────────────────────────────────────────
export { Abas, ListaAbas, Aba, PainelAba } from './components/Abas'
export type { AbasProps, ListaAbasProps, AbaProps, PainelAbaProps, VarianteAbas } from './components/Abas'

export { Acordeao, ItemAcordeao } from './components/Acordeao'
export type { AcordeaoProps, ItemAcordeaoProps, TipoAcordeao } from './components/Acordeao'

export { Trilha, ItemTrilha } from './components/Trilha'
export type { TrilhaProps, ItemTrilhaProps } from './components/Trilha'

// `janelaPaginas` sai exportada porque é onde mora todo o risco da paginação (a lógica
// de reticências), é pura, e quem montar uma paginação própria merece reusá-la testada.
export { Paginacao, janelaPaginas } from './components/Paginacao'
export type { PaginacaoProps, ItemPagina } from './components/Paginacao'

// ── Utilitário ───────────────────────────────────────────────────────────────
export { cx } from './utils/cx'
