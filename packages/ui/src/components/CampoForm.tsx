import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cx } from '../utils/cx'
import './CampoForm.css'

/** O que o CampoForm liga no controle. Recebido por quem usa `children` como função. */
export interface FiacaoCampo {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
  'aria-required': true | undefined
}

export interface CampoFormProps {
  /** O rótulo. Obrigatório: campo sem rótulo é campo que o leitor de tela chama de "editar". */
  label: ReactNode
  /** Texto de apoio: formato esperado, unidade, limite ("máximo de 500 caracteres"). */
  ajuda?: ReactNode
  /** A mensagem de erro. Presente = campo inválido. `undefined` = campo válido. */
  erro?: string
  /** Marca o campo como obrigatório (asterisco + `aria-required` + a palavra). */
  obrigatorio?: boolean
  /** Force um id fixo se precisar (âncora, teste E2E). Do contrário um é gerado. */
  id?: string
  className?: string
  /**
   * O controle (`<Campo>`, `<AreaTexto>`, ou o seu). Um elemento só — o CampoForm o clona
   * para injetar id e ARIA. Se precisar envolver o controle em outra coisa, passe uma
   * função e ligue os atributos à mão.
   */
  children: ReactNode | ((fiacao: FiacaoCampo) => ReactNode)
}

/**
 * CampoForm — o rótulo, a ajuda e o erro de um campo, amarrados por ARIA.
 *
 * **A razão de existir.** Um `<label>` solto ao lado de um `<input>` não é um rótulo: sem
 * `htmlFor` apontando para o `id`, quem usa leitor de tela ouve "campo de edição" e nada
 * mais — não sabe QUAL campo nem QUAL erro. Este componente gera o id, liga o label, liga
 * a ajuda e o erro por `aria-describedby`, e marca `aria-invalid` — tudo o que ninguém
 * lembra de fazer à mão em 40 campos de um formulário.
 *
 * @example
 * <CampoForm label="E-mail" ajuda="usamos só para o recibo" erro={erros.email} obrigatorio>
 *   <Campo type="email" {...register('email')} />
 * </CampoForm>
 *
 * @example Controle envolvido em outra coisa — ligue à mão
 * <CampoForm label="Valor">
 *   {({ id, ...aria }) => <div className="grid"><Campo id={id} {...aria} /><Dica /></div>}
 * </CampoForm>
 */
export function CampoForm({
  label,
  ajuda,
  erro,
  obrigatorio,
  id: idProp,
  className,
  children,
}: CampoFormProps) {
  // useId em vez de um contador global: em SSR (Astro, Next) dois contadores independentes
  // — servidor e cliente — geram ids diferentes, o React reclama de hidratação e o
  // `htmlFor` aponta para um id que não existe. O useId é estável nos dois lados.
  const gerado = useId()

  // O id do controle é decidido AQUI, antes de qualquer render, e é um só. A ordem é
  // `id` do wrapper > id que o controle já trazia > gerado.
  // Por que ler o id do filho em vez de só respeitá-lo no clone: quem escreve
  // `<CampoForm label="Nome"><Campo id="meu-id" /></CampoForm>` ficaria com o htmlFor do
  // label apontando para o id gerado e o input com outro — rótulo mudo, exatamente o bug
  // que este componente existe para não deixar acontecer. Label e controle nunca podem
  // discordar sobre o id, então há uma variável só.
  const idFilho = isValidElement(children)
    ? ((children as ReactElement<Record<string, unknown>>).props.id as string | undefined)
    : undefined
  const id = idProp ?? idFilho ?? gerado
  const idAjuda = `${id}-ajuda`
  const idErro = `${id}-erro`

  // Erro E ajuda são anunciados os DOIS, com o erro primeiro. A tentação é esconder a
  // ajuda quando há erro, mas ela costuma ser exatamente a informação que falta na hora de
  // consertar ("mínimo de 8 caracteres"): sumir com ela justamente no momento do erro é
  // tirar a instrução de quem mais precisa dela. A ordem importa porque é a ordem da fala:
  // primeiro o que houve, depois a regra.
  // Boolean() e não `ajuda &&`: `ajuda` é ReactNode, então aceita 0 — e `{0 && <p/>}`
  // imprime um "0" solto na tela. O mesmo teste decide o id e a renderização, para o
  // describedby nunca apontar para um parágrafo que não foi renderizado.
  const temAjuda = Boolean(ajuda)
  const temErro = Boolean(erro)
  const descrito = cx(temErro && idErro, temAjuda && idAjuda) || undefined

  const fiacao: FiacaoCampo = {
    id,
    'aria-describedby': descrito,
    'aria-invalid': temErro ? true : undefined,
    // aria-required e não o `required` do HTML: `required` liga a validação nativa do
    // navegador, que abre o balãozinho dele ("Preencha este campo"), em inglês do sistema
    // e por cima da nossa mensagem — duas mensagens diferentes para o mesmo erro. Quem
    // quiser a validação nativa passa `required` no próprio controle, de propósito.
    'aria-required': obrigatorio ? true : undefined,
  }

  return (
    <div className={cx('amb-campo-form', className)}>
      <label className="amb-campo-form__label" htmlFor={id}>
        {label}
        {obrigatorio && (
          <>
            {/* O asterisco é decorativo. Símbolo sozinho não informa: quem usa leitor de
                tela ouviria "asterisco" (ou nada), e quem não conhece a convenção não sabe
                o que ele quer dizer. Quem carrega o sentido é a palavra logo abaixo — e o
                aria-required no controle. Três avisos, nenhum dependendo de cor.
                Efeito colateral consciente: o nome acessível do campo passa a ser "Nome
                (obrigatório)". Em teste, `getByLabelText(/nome/i)` em vez de string exata. */}
            <span className="amb-campo-form__asterisco" aria-hidden="true">
              *
            </span>
            <span className="amb-sr-only"> (obrigatório)</span>
          </>
        )}
      </label>

      {ligar(children, fiacao)}

      {/* role="alert" para ser anunciado no instante em que aparece, sem roubar o foco de
          onde a pessoa está. Funciona porque o elemento é MONTADO junto com o erro (render
          condicional): um <p role="alert"> que fica sempre no DOM e só troca de texto passa
          despercebido em parte dos leitores de tela. Daí o `{erro && ...}`. */}
      {temErro && (
        <p id={idErro} className="amb-campo-form__erro" role="alert">
          {erro}
        </p>
      )}

      {temAjuda && (
        <p id={idAjuda} className="amb-campo-form__ajuda">
          {ajuda}
        </p>
      )}
    </div>
  )
}

/** Injeta a fiação no controle: por função (controle total) ou por clone (caso comum). */
function ligar(children: CampoFormProps['children'], fiacao: FiacaoCampo): ReactNode {
  if (typeof children === 'function') return children(fiacao)

  if (!isValidElement(children)) {
    if (process.env.NODE_ENV !== 'production') {
      // Texto solto, fragmento ou dois controles: não há onde pendurar o id, e o
      // `htmlFor` do label apontaria para o nada. Falha em silêncio na tela e só aparece
      // numa auditoria de acessibilidade meses depois — por isso o aviso.
      console.warn(
        '[@amboni/ui] <CampoForm> precisa de UM elemento como filho para ligar o rótulo. ' +
          'Para casos com mais de um elemento, use children como função: ' +
          '<CampoForm label="…">{(fiacao) => <Campo {...fiacao} />}</CampoForm>',
      )
    }
    return children
  }

  const filho = children as ReactElement<Record<string, unknown>>
  const props = filho.props

  return cloneElement(filho, {
    // Sem `props.id ?? ` aqui de propósito: o id já foi resolvido lá em cima levando o do
    // filho em conta. Reaproveitá-lo aqui abriria a porta para o label apontar para um id
    // e o controle usar outro.
    id: fiacao.id,
    // Já o ARIA o controle pode declarar por conta própria — e aí ele vence: quem escreveu
    // `aria-invalid` à mão está tratando um caso que o wrapper não conhece.
    'aria-invalid': props['aria-invalid'] ?? fiacao['aria-invalid'],
    'aria-required': props['aria-required'] ?? fiacao['aria-required'],
    // describedby é a exceção: aqui os dois SOMAM em vez de um vencer. O controle pode ter
    // sua própria descrição (uma dica de senha, um contador) e trocá-la pela nossa perderia
    // informação — aria-describedby aceita vários ids justamente para isso.
    'aria-describedby':
      cx(fiacao['aria-describedby'], props['aria-describedby'] as string | undefined) || undefined,
  })
}
