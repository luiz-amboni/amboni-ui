import { type ReactNode } from 'react'
import { Dialogo, type DialogoSize } from './Dialogo'
import { cx } from '../utils/cx'
import './Gaveta.css'

export type GavetaLado = 'esquerda' | 'direita' | 'baixo'

export interface GavetaProps {
  aberto: boolean
  /** Ver `Dialogo.onFechar` — mesma regra: quem fecha é você, virando o `aberto`. */
  onFechar: () => void
  /**
   * `direita` (padrão) — detalhe, filtro, formulário. O padrão da web ocidental: a
   * ação nasce à direita e é para lá que o olho vai.
   * `esquerda` — navegação (menu do celular), que mora à esquerda.
   * `baixo` — folha do celular, ao alcance do polegar.
   * @default 'direita'
   */
  lado?: GavetaLado
  /** Obrigatório: é o nome acessível da gaveta. */
  titulo: ReactNode
  descricao?: ReactNode
  children?: ReactNode
  /** Barra de ações fixa no pé — numa gaveta de formulário, é onde mora o "Aplicar". */
  rodape?: ReactNode
  /** Largura (esquerda/direita) ou altura (baixo). @default 'md' */
  size?: DialogoSize
  className?: string
}

/**
 * Gaveta — o painel que entra pela lateral.
 *
 * É o **Dialogo por dentro**, só que ancorado numa borda em vez de centralizado. Não é
 * economia de digitação: modal e gaveta têm exatamente os mesmos seis problemas
 * difíceis (top layer, Esc avisando o React, foco de volta em quem abriu, trava da
 * rolagem contada, clique no fundo por geometria, inertizar o resto da página). Duplicar
 * isso significaria consertar cada bug duas vezes — e, na prática, esquecer de um lado.
 * Aqui a Gaveta é CSS: posição, tamanho e a animação de deslize.
 *
 * Quando usar em vez do Dialogo: quando a pessoa precisa ver a lista atrás enquanto mexe
 * (filtro, detalhe de um item da tabela). Para decidir algo agora — confirmar, avisar —
 * o modal centralizado é melhor: ele interrompe de propósito.
 *
 * @example
 * <Gaveta aberto={aberto} onFechar={fechar} titulo="Filtros" lado="direita">
 *   <CampoData /> <SeletorStatus />
 * </Gaveta>
 */
export function Gaveta({
  aberto, onFechar, lado = 'direita', titulo, descricao, children, rodape, size = 'md', className,
}: GavetaProps) {
  return (
    <Dialogo
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      descricao={descricao}
      rodape={rodape}
      // O `size` vai para o Dialogo e vira `.amb-dialogo--md` — a Gaveta traduz essa
      // mesma classe em largura ou altura no CSS, em vez de inventar um segundo eixo
      // de tamanhos que sairia do lugar quando o Dialogo mudasse.
      size={size}
      className={cx('amb-gaveta', `amb-gaveta--${lado}`, className)}
    >
      {children}
    </Dialogo>
  )
}
