import { type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './EstadoVazio.css'

export type EstadoVazioSize = 'sm' | 'md' | 'lg'

export interface EstadoVazioProps {
  /** Ícone. Decorativo — quem informa é o título. */
  icone?: ReactNode
  /**
   * O que aconteceu, em uma linha. **Não use "Nenhum resultado"** — isso a pessoa já
   * viu sozinha, olhando a tela em branco. Diga o que faltou: "Nenhum cliente com
   * esse filtro".
   */
  titulo: string
  /** Por que está vazio, e o que fazer agora. É aqui que o estado vazio ganha utilidade. */
  descricao?: ReactNode
  /** Um `<Button>`. Limpar o filtro, ou criar o primeiro registro — ver o JSDoc. */
  acao?: ReactNode
  /**
   * `sm` — dentro de tabela/card pequeno.
   * `md` (padrão) — dentro de card.
   * `lg` — página inteira vazia.
   * @default 'md'
   */
  size?: EstadoVazioSize
  className?: string
}

/**
 * EstadoVazio — a tela em branco que explica a si mesma.
 *
 * "Nenhum resultado" não ajuda ninguém: a pessoa está olhando para o nada e não sabe
 * se filtrou demais, se ainda não cadastrou, ou se o sistema quebrou. Um estado vazio
 * bom responde três coisas: **o que aconteceu, por quê, e o que fazer agora.**
 *
 * Mesma tese do `emptyReason` do StatCard.
 *
 * ## Os dois vazios são problemas diferentes — não os trate igual
 *
 * **Vazio por filtro** — existem dados, o filtro é que escondeu. A pessoa fez algo e o
 * sistema respondeu com nada; ela precisa desfazer. A ação é *limpar o filtro*, nunca
 * "criar". Oferecer "Novo cliente" para quem tem 4.000 clientes e filtrou errado é
 * responder outra pergunta.
 *
 * ```tsx
 * <EstadoVazio
 *   titulo="Nenhum cliente com esse filtro"
 *   descricao="Nenhum cliente comprou nos últimos 7 dias. Tente um período maior."
 *   acao={<Button onClick={limparFiltros}>Limpar filtros</Button>}
 * />
 * ```
 *
 * **Vazio porque é novo** — não existe dado nenhum ainda. Aqui a tela vazia é a
 * primeira aula do produto: diga para que serve a coisa e dê o caminho para começar.
 * A ação é *criar*.
 *
 * ```tsx
 * <EstadoVazio
 *   icone={<Megafone />}
 *   titulo="Nenhuma campanha ainda"
 *   descricao="Campanhas reativam quem não compra há mais de 6 meses."
 *   acao={<Button variant="primary" onClick={criar}>Criar campanha</Button>}
 *   size="lg"
 * />
 * ```
 *
 * **Vazio por erro é outra coisa** — não use este componente. Erro pede tentar de novo
 * e precisa parecer erro; vazio é um estado normal do sistema.
 */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  acao,
  size = 'md',
  className,
}: EstadoVazioProps) {
  return (
    <div className={cx('amb-vazio', `amb-vazio--${size}`, className)}>
      {icone && (
        <div className="amb-vazio__icone" aria-hidden="true">
          {icone}
        </div>
      )}

      {/* Título é <p>, não <h3>: este componente vive dentro de tabela e de card, e um
          heading solto aí dentro entra no índice que o leitor de tela usa para navegar
          a página — "Nenhum cliente com esse filtro" viraria uma seção do documento.
          Quem precisa de heading real põe um <CardHeader> em volta. */}
      <p className="amb-vazio__titulo">{titulo}</p>

      {descricao && <p className="amb-vazio__descricao">{descricao}</p>}

      {acao && <div className="amb-vazio__acao">{acao}</div>}
    </div>
  )
}
