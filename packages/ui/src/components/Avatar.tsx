import { Children, forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Avatar.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'
export type AvatarFormato = 'circulo' | 'quadrado'
export type AvatarStatus = 'online' | 'ausente' | 'offline'

/**
 * Os tons que o sorteio de cor pode tirar.
 *
 * São os mesmos tons semânticos da paleta, usados aqui como IDENTIDADE, não como
 * estado — e isso é seguro justamente por causa da regra da casa: nesta biblioteca
 * significado nunca anda só na cor. Um avatar no tom `perigo` não quer dizer que a
 * pessoa tem um problema; quem diz "Falhou" é o texto de um `<Selo>` ao lado.
 */
const TONS_AVATAR = ['marca', 'sucesso', 'aviso', 'perigo', 'info'] as const
export type AvatarTom = (typeof TONS_AVATAR)[number]

/**
 * "Maria Silva Santos" → "MS". Primeira + **ÚLTIMA** palavra, não as duas primeiras:
 * em português metade dos nomes tem partícula no meio ("Maria da Silva"), e a regra
 * ingênua devolveria "MD" — que não é a inicial de ninguém.
 *
 * Acentos são preservados de propósito: "Ángela" é "Á". Jogar o acento fora deixaria
 * o avatar escrevendo o nome da pessoa errado, que é exatamente o que ela nota.
 */
export function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return ''

  // Nome de uma palavra só ("Madonna", "@joana"): duas letras dela mesma. Uma letra
  // sozinha num círculo grande fica com cara de bug.
  const bruto = partes.length === 1 ? partes[0]!.slice(0, 2) : partes[0]![0]! + partes[partes.length - 1]![0]!

  // `pt-BR` explícito: no locale turco, `toUpperCase` de "i" vira "İ".
  return bruto.toLocaleUpperCase('pt-BR')
}

/**
 * Sorteia um tom a partir do nome. **Determinístico**: a mesma pessoa tem sempre a
 * mesma cor, em toda tela, entre sessões e entre máquinas.
 *
 * Isso não é enfeite. Numa lista de 40 clientes, a cor estável é o que deixa o olho
 * reencontrar alguém sem ler todos os nomes; cor aleatória a cada render faria a lista
 * piscar a cada atualização e não ajudaria ninguém.
 *
 * Normaliza caixa e acento antes: "JOSÉ SILVA", "José Silva" e "jose silva" são a
 * mesma pessoa vinda de três lugares do banco, e precisam do mesmo círculo.
 */
export function tomDoNome(nome: string): AvatarTom {
  const limpo = nome
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    // NFD separa “é” em “e” + acento solto, e a faixa U+0300–U+036F varre os acentos
    // soltos. Em escape, nunca com o caractere cru: um acento combinante colado num `[`
    // no código-fonte é invisível no editor e vira bug que ninguém acha.
    .replace(/[\u0300-\u036f]/g, '')

  // djb2. Não é criptografia — é só espalhar nomes parecidos ("Ana Silva"/"Ana Souza")
  // em tons diferentes com 5 linhas e zero dependência.
  let hash = 5381
  for (let i = 0; i < limpo.length; i++) {
    hash = ((hash << 5) + hash + limpo.charCodeAt(i)) >>> 0
  }
  return TONS_AVATAR[hash % TONS_AVATAR.length]!
}

/** Silhueta para quando não há nome nem imagem. Desenhada aqui: sem pacote de ícones. */
function IconePessoa() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" width="60%" height="60%">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.1 0-7.5 2.4-7.5 5.3 0 .9.8 1.7 1.8 1.7h11.4c1 0 1.8-.8 1.8-1.7 0-2.9-3.4-5.3-7.5-5.3Z" />
    </svg>
  )
}

const ROTULO_STATUS: Record<AvatarStatus, string> = {
  online: 'online',
  ausente: 'ausente',
  offline: 'offline',
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Foto. Se faltar — ou se o link quebrar — cai nas iniciais sozinho. */
  src?: string
  /** Nome completo. Vira as iniciais, a cor e o rótulo acessível. */
  nome: string
  /** @default 'md' */
  size?: AvatarSize
  /** @default 'circulo' */
  formato?: AvatarFormato
  /** Presença. Vem com texto para leitor de tela — a bolinha não é o único sinal. */
  status?: AvatarStatus
  /**
   * O avatar está ao lado do nome já escrito na tela (linha de tabela, item de lista).
   *
   * Some para o leitor de tela (`alt=""`, sem texto oculto). Sem isto a pessoa ouve
   * **"Maria Silva, Maria Silva"** em cada uma das 40 linhas — é o defeito mais comum
   * de tabela com avatar. Se o avatar aparece sozinho (barra de topo, pilha de
   * participantes), deixe `false`: aí ele é a única pista de quem é.
   * @default false
   */
  decorativo?: boolean
}

/**
 * Avatar — a pessoa.
 *
 * Foto quando dá, iniciais quando não dá, e nunca um ícone quebrado.
 *
 * @example Sozinho: precisa se anunciar
 * <Avatar nome="Maria Silva Santos" src={foto} status="online" />
 *
 * @example Ao lado do nome escrito: cala a boca para o leitor de tela
 * <Avatar nome="Maria Silva Santos" decorativo /> <span>Maria Silva Santos</span>
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, nome, size = 'md', formato = 'circulo', status, decorativo = false, className, ...rest },
  ref,
) {
  // Guarda QUAL src quebrou, não um booleano: assim trocar a foto (novo `src`) volta a
  // tentar carregar sozinho, sem useEffect de reset — o bug clássico do `if (erro)`,
  // que trava nas iniciais para sempre depois da primeira falha.
  const [srcQuebrado, setSrcQuebrado] = useState<string | null>(null)
  const mostrarImagem = Boolean(src) && srcQuebrado !== src

  const iniciais = iniciaisDoNome(nome)
  const tom = tomDoNome(nome)

  return (
    <span
      ref={ref}
      className={cx(
        'amb-avatar',
        `amb-avatar--${size}`,
        `amb-avatar--${formato}`,
        // O tom só pinta as iniciais. Com foto, o fundo colorido apareceria nos cantos
        // de uma imagem transparente e sujaria a foto.
        !mostrarImagem && `amb-avatar--tom-${tom}`,
        className,
      )}
      {...rest}
    >
      {mostrarImagem ? (
        <img
          className="amb-avatar__img"
          src={src}
          // Decorativo → alt="" (ignorado). Senão, o nome: um `alt="avatar"` obriga a
          // pessoa a adivinhar de quem é.
          alt={decorativo ? '' : nome}
          // Link expirado de Google/Gravatar/S3 é rotina em produção. Sem isto a tela
          // enche de ícone de imagem quebrada — pior que não ter foto nenhuma.
          onError={() => setSrcQuebrado(src ?? null)}
        />
      ) : iniciais ? (
        // Iniciais são desenho: "MS" lido em voz alta ("ême-esse") não é o nome de
        // ninguém. Quem fala é o texto oculto abaixo.
        <span className="amb-avatar__iniciais" aria-hidden="true">
          {iniciais}
        </span>
      ) : (
        // Nome vazio (cliente importado sem cadastro): silhueta. Um círculo em branco
        // parece falha de carregamento.
        <IconePessoa />
      )}

      {!decorativo && !mostrarImagem && nome.trim() !== '' && <span className="amb-sr-only">{nome}</span>}

      {status && (
        <>
          <span className={cx('amb-avatar__status', `amb-avatar__status--${status}`)} aria-hidden="true" />
          {/* A bolinha é forma + cor para o olho, e TEXTO para o resto: verde e âmbar
              são o mesmo ponto cinza para quem não distingue, e nada para quem ouve. */}
          {!decorativo && <span className="amb-sr-only">{ROTULO_STATUS[status]}</span>}
        </>
      )}
    </span>
  )
})

export interface GrupoAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * Quantos aparecem antes do "+N". Sem valor, aparecem todos.
   * 4 ou 5 é o teto útil: a partir daí a pilha vira uma mancha e o "+N" informa mais.
   */
  max?: number
  /** Precisa bater com o `size` dos avatares — é ele que dimensiona o "+N". @default 'md' */
  size?: AvatarSize
  /** Os `<Avatar>`. */
  children: ReactNode
}

/**
 * GrupoAvatar — pilha de pessoas com sobreposição.
 *
 * @example
 * <GrupoAvatar max={3}>
 *   <Avatar nome="Ana Souza" /> <Avatar nome="Bruno Lima" /> ...
 * </GrupoAvatar>
 */
export const GrupoAvatar = forwardRef<HTMLSpanElement, GrupoAvatarProps>(function GrupoAvatar(
  { max, size = 'md', children, className, ...rest },
  ref,
) {
  // toArray descarta null/undefined e achata fragmentos — sem isso um
  // `{podeVer && <Avatar/>}` falso contaria como pessoa e o "+N" mentiria.
  const todos = Children.toArray(children)
  const visiveis = max !== undefined ? todos.slice(0, max) : todos
  const excedente = todos.length - visiveis.length

  return (
    // Sem `role="group"`: um grupo sem nome só acrescenta "grupo" ao que o leitor de
    // tela já ia ler. Os avatares se anunciam sozinhos. Quem precisar de um nome para a
    // pilha põe `aria-label` daqui de fora, e aí sim vira um grupo de verdade.
    <span ref={ref} className={cx('amb-grupo-avatar', className)} {...rest}>
      {visiveis}
      {excedente > 0 && (
        <span className={cx('amb-grupo-avatar__mais', `amb-avatar--${size}`, 'amb-avatar--circulo')}>
          <span aria-hidden="true">+{excedente}</span>
          {/* "+3" vira "mais três" ou "sinal de mais três" dependendo do leitor — nenhum
              dos dois diz o que é. O texto por extenso diz. */}
          <span className="amb-sr-only">
            mais {excedente} {excedente === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </span>
      )}
    </span>
  )
})
