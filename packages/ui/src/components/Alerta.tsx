import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import './Alerta.css'

export type AlertaTom = 'info' | 'sucesso' | 'aviso' | 'perigo'

export interface AlertaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /**
   * `info` — contexto, nada a fazer.
   * `sucesso` — deu certo.
   * `aviso` — deu certo mas tem ressalva, ou vai dar errado se continuar assim.
   * `perigo` — falhou, ou vai falhar. **Só este interrompe o leitor de tela** (ver abaixo).
   * @default 'info'
   */
  tom?: AlertaTom
  /** Uma linha que resume tudo. Quem lê rápido lê só isto. */
  titulo?: ReactNode
  /** O detalhe: o que aconteceu e o que fazer. */
  children?: ReactNode
  /**
   * Troca o ícone padrão do tom. **Pense duas vezes**: o ícone padrão é o que
   * diferencia os tons para quem não enxerga cor. Trocando os quatro por variações do
   * mesmo desenho, o alerta volta a depender só do vermelho/verde.
   */
  icone?: ReactNode
  /** Mostra o X de fechar. Exige `onDispensar` para fazer algo. */
  dispensavel?: boolean
  onDispensar?: () => void
  /** Um botão — "Tentar de novo", "Ver detalhes". Um só: duas saídas viram nenhuma. */
  acao?: ReactNode
}

/**
 * Os quatro ícones desenhados aqui: a biblioteca não impõe pacote de ícones a quem
 * instala (mesma decisão da seta do StatCard).
 *
 * Cada tom tem uma FORMA diferente, não só uma cor diferente — círculo-i, círculo-✓,
 * triângulo-! e octógono-✕. Cerca de 1 em cada 12 homens não distingue vermelho de
 * verde: para essas pessoas, "sucesso" e "perigo" pintados só de verde e vermelho são
 * o mesmo alerta cinza. A forma é o que sobra. Triângulo e octógono também são as
 * formas que a sinalização de trânsito já ensinou a ler como "atenção" e "pare".
 */
const ICONES: Record<AlertaTom, ReactNode> = {
  // Círculo com "i" — a forma mais neutra, nada a fazer.
  info: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9.25v4.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="1" fill="currentColor" />
    </svg>
  ),
  // Círculo com check — mesma moldura do info, glifo inequívoco.
  sucesso: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.25 10.25 8.75 12.75 13.75 7.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Triângulo — "atenção" na sinalização de trânsito do mundo inteiro.
  aviso: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M10 2.75 18.25 17.25H1.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8v3.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="10" cy="14.4" r="1" fill="currentColor" />
    </svg>
  ),
  // Octógono com ✕ — a forma de "pare". Reconhecível mesmo em miniatura e sem cor.
  perigo: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M6.9 1.75h6.2L17.5 6.9v6.2l-4.4 5.15H6.9L2.5 13.1V6.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.6 7.6 12.4 12.4M12.4 7.6 7.6 12.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
}

/** X de dispensar. Desenhado aqui pelo mesmo motivo dos ícones de tom. */
function IconeX() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M4 4 12 12M12 4 4 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Alerta — o sistema falando com quem usa.
 *
 * ## A decisão que define este componente: quem interrompe e quem espera
 *
 * Um alerta que só existe na tela não existe para quem usa leitor de tela. Quem resolve
 * isso é o `role`, e a escolha não é estética:
 *
 * · `role="alert"` (= `aria-live="assertive"`) **corta a frase que está sendo lida** e
 *   anuncia na hora. É o certo para `perigo`: o pagamento falhou, o formulário não
 *   enviou — a pessoa precisa saber ANTES de continuar digitando.
 * · `role="status"` (= `aria-live="polite"`) espera a leitura atual terminar. É o certo
 *   para `info`, `sucesso` e `aviso`: são importantes, não urgentes.
 *
 * Marcar tudo como `alert` é como gritar toda frase — a pessoa desliga o recurso, e aí
 * nem o erro de verdade chega. Por isso só `perigo` interrompe.
 *
 * @example
 * <Alerta tom="sucesso" titulo="Cliente salvo" />
 *
 * @example Erro — interrompe o leitor de tela, e diz o que fazer
 * <Alerta tom="perigo" titulo="Não foi possível enviar" acao={<Button onClick={retry}>Tentar de novo</Button>}>
 *   O WhatsApp recusou a mensagem: número sem conta.
 * </Alerta>
 */
export const Alerta = forwardRef<HTMLDivElement, AlertaProps>(function Alerta(
  { tom = 'info', titulo, children, icone, dispensavel, onDispensar, acao, className, ...rest },
  ref,
) {
  const urgente = tom === 'perigo'

  return (
    <div
      ref={ref}
      // Ver o bloco de documentação acima: só `perigo` interrompe a leitura.
      role={urgente ? 'alert' : 'status'}
      className={cx('amb-alerta', `amb-alerta--${tom}`, className)}
      {...rest}
    >
      {/* Decorativo: o ícone reforça o tom para quem VÊ. Quem ouve recebe o mesmo
          significado pelo texto do título — por isso ele não vira imagem narrada. */}
      <span className="amb-alerta__icone" aria-hidden="true">
        {icone ?? ICONES[tom]}
      </span>

      <div className="amb-alerta__corpo">
        {titulo && <p className="amb-alerta__titulo">{titulo}</p>}
        {children && <div className="amb-alerta__texto">{children}</div>}
        {acao && <div className="amb-alerta__acao">{acao}</div>}
      </div>

      {dispensavel && (
        // <button> de verdade: recebe foco, responde a Enter/Espaço e é anunciado como
        // botão. Um <span onClick> com um X desenhado não faz nada disso.
        <button
          type="button"
          className={cx('amb-alerta__x', 'amb-focus-ring')}
          onClick={onDispensar}
          // Sem rótulo, o leitor de tela anuncia só "botão" — e ninguém fecha o que não
          // consegue nomear.
          aria-label="Dispensar aviso"
        >
          <IconeX />
        </button>
      )}
    </div>
  )
})
