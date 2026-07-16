import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Selo.css'

export type SeloTom = 'neutro' | 'marca' | 'sucesso' | 'aviso' | 'perigo' | 'info'
export type SeloVariante = 'suave' | 'solido' | 'contorno'
export type SeloSize = 'sm' | 'md'

export interface SeloProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * O tom REFORÇA o texto — nunca substitui. Ver o aviso no componente.
   * @default 'neutro'
   */
  tom?: SeloTom
  /**
   * `suave` — o padrão. Fundo tingido, discreto o bastante para conviver com dezenas
   * deles numa tabela sem virar árvore de natal.
   * `solido` — para o selo que precisa saltar (um "Falhou" no meio de "Entregue").
   * Use com parcimônia: se tudo salta, nada salta.
   * `contorno` — só borda. Para quando o fundo já é tingido e um segundo tingido some.
   * @default 'suave'
   */
  variante?: SeloVariante
  /** @default 'md' */
  size?: SeloSize
  /**
   * Bolinha de status antes do texto. Decorativa — quem informa continua sendo o texto.
   * Serve para o olho achar a linha na tabela, não para dizer o que aconteceu.
   */
  pontinho?: boolean
  /**
   * O rótulo. **Obrigatório e não pode ser vazio** — é ele que carrega o significado.
   * Um selo sem texto é uma bolinha colorida que só parte das pessoas consegue ler.
   */
  children: ReactNode
}

/**
 * Selo — o ESTADO de alguma coisa. Read-only.
 *
 * "Entregue", "Falhou", "Pendente". Você lê, não mexe. Se dá para remover, clicar ou
 * filtrar, o componente é a `<Etiqueta>` — não este.
 *
 * ## A regra de ouro desta biblioteca: a cor nunca é o único sinal
 * Um selo verde "Entregue" e um vermelho "Falhou" são **o mesmo selo** para cerca de
 * 1 em cada 12 homens (daltonismo vermelho-verde) e para qualquer um lendo em preto e
 * branco, no sol, ou por leitor de tela. Por isso o `children` é obrigatório: o texto
 * carrega o significado, a cor só ajuda a achar mais rápido. É também por isso que o
 * `pontinho` é `aria-hidden` — ele é enfeite de varredura visual, não informação.
 *
 * Todas as combinações de cor saem dos tokens já testados em contraste (@amboni/tokens),
 * então o selo é legível em iSafe/VEAR × claro/escuro sem ajuste no produto.
 *
 * @example
 * <Selo tom="sucesso" pontinho>Entregue</Selo>
 * <Selo tom="perigo" variante="solido">Falhou</Selo>
 *
 * @example ERRADO — a cor não diz nada sozinha
 * <Selo tom="sucesso" pontinho />          // nem compila: children é obrigatório
 */
export const Selo = forwardRef<HTMLSpanElement, SeloProps>(function Selo(
  { tom = 'neutro', variante = 'suave', size = 'md', pontinho, children, className, ...rest },
  ref,
) {
  if (process.env.NODE_ENV !== 'production' && (children === null || children === undefined || children === '')) {
    // O TypeScript já exige `children`, mas `children={cond && 'Ativo'}` passa pelo tipo
    // e chega aqui como `false`. Avisa em desenvolvimento em vez de renderizar uma
    // bolinha muda em produção.
    console.warn(
      '[@amboni/ui] <Selo> sem texto. A cor sozinha não comunica: ' +
        'quem não distingue vermelho de verde (1 em cada 12 homens) vê um selo vazio.',
    )
  }

  return (
    <span
      ref={ref}
      className={cx('amb-selo', `amb-selo--${tom}`, `amb-selo--${variante}`, `amb-selo--${size}`, className)}
      {...rest}
    >
      {pontinho && <span className="amb-selo__pontinho" aria-hidden="true" />}
      {children}
    </span>
  )
})
