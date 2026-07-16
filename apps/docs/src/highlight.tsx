/**
 * Realce de sintaxe para JSX/CSS — sem dependência.
 *
 * Prism/Shiki pesam de 40 kB a 1 MB. Para os trechos curtos de uma documentação isso é
 * absurdo: o realce pesaria mais que a biblioteca sendo documentada.
 *
 * PASSAGEM ÚNICA, de propósito. A versão ingênua — um `.replace()` por regra, em
 * sequência — se autodestrói: a regra de atributo encontra o `class="tok-str"` do
 * <span> que a regra de string acabou de inserir e colore o próprio realce. Aqui uma
 * regex alternada varre o texto uma vez e cada trecho é classificado no primeiro
 * padrão que casar; o HTML só é montado no fim, quando não sobrou nada para varrer.
 *
 * As cores vêm dos tokens (tok-* no docs.css) — os dois temas funcionam de graça.
 */

/**
 * `js` e `ts` são apelidos de `jsx`: as regras já cobrem os três, e forçar quem escreve
 * a documentação a lembrar que "um trecho de TypeScript se marca como jsx" é atrito sem
 * ganho. `text` desliga o realce — para saída de terminal e mensagem de erro, onde
 * colorir palavra solta ("const" no meio de uma frase) inventa sintaxe que não existe.
 */
export type Linguagem = 'jsx' | 'js' | 'ts' | 'css' | 'text'

type Dialeto = 'jsx' | 'css'
const APELIDO: Record<Exclude<Linguagem, 'text'>, Dialeto> = {
  jsx: 'jsx', js: 'jsx', ts: 'jsx', css: 'css',
}

/** Grupos NOMEADOS: o nome do grupo que casou É a classe CSS. */
const PADRAO: Record<Dialeto, RegExp> = {
  // ordem = precedência: comentário e string primeiro, senão o conteúdo deles é lido
  // como código ("// <Button> não é uma tag, é um comentário")
  jsx: new RegExp(
    [
      String.raw`(?<com>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
      String.raw`(?<str>'[^'\n]*'|"[^"\n]*"|\`[^\`]*\`)`,
      String.raw`(?<tag><\/?[A-Z][\w.]*)`,
      String.raw`(?<kw>\b(?:import|from|export|default|const|let|function|return|await|async|new|true|false|null|undefined)\b)`,
      String.raw`(?<attr>\b[a-zA-Z][\w-]*(?==))`,
      String.raw`(?<num>\b\d+(?:\.\d+)?\b)`,
    ].join('|'),
    'g',
  ),
  css: new RegExp(
    [
      String.raw`(?<com>\/\*[\s\S]*?\*\/)`,
      String.raw`(?<str>'[^'\n]*'|"[^"\n]*")`,
      String.raw`(?<kw>\b(?:var|calc|color-mix|clamp)\b)`,
      String.raw`(?<num>#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|ms|s)?\b)`,
      String.raw`(?<attr>--[\w-]+)`,
      String.raw`(?<tag>[.#][\w-]+)`,
    ].join('|'),
    'g',
  ),
}

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function realcar(codigo: string, lang: Linguagem = 'jsx'): string {
  // `text` sai escapado e cru: é saída de terminal e mensagem de erro, onde marcar
  // palavra solta ("const" no meio de uma frase) inventaria sintaxe que não existe.
  if (lang === 'text') return escapar(codigo)

  const re = new RegExp(PADRAO[APELIDO[lang]].source, 'g') // cópia: lastIndex é mutável
  let out = ''
  let fim = 0

  for (const m of codigo.matchAll(re)) {
    const classe = Object.entries(m.groups ?? {}).find(([, v]) => v !== undefined)?.[0]
    if (!classe) continue

    out += escapar(codigo.slice(fim, m.index)) // o que veio antes vai cru (escapado)
    out += `<span class="tok-${classe}">${escapar(m[0])}</span>`
    fim = m.index + m[0].length
  }

  return out + escapar(codigo.slice(fim))
}

export function Codigo({ children, lang = 'jsx' }: { children: string; lang?: Linguagem }) {
  // dangerouslySetInnerHTML é seguro aqui: todo trecho passa por escapar() e o conteúdo
  // vem de literais do próprio site, nunca de entrada de usuário.
  return <code dangerouslySetInnerHTML={{ __html: realcar(children, lang) }} />
}
