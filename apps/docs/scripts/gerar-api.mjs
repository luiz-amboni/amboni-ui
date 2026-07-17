// @ts-check
import ts from 'typescript'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Gera a referência de API a partir do CÓDIGO dos componentes.
 *
 * A DECISÃO CENTRAL: esta referência é gerada, nunca escrita. Tabela de props escrita à
 * mão é verdade só no dia em que foi escrita — na primeira prop nova ela vira uma mentira
 * com cara de autoridade, que é pior que não ter documentação nenhuma (já aconteceu aqui:
 * a tabela do Button dizia "32, 40 ou 48px" quando o token sempre foi 36/44/52). Por isso
 * o `prebuild` do docs roda este script: a referência não tem COMO ficar velha, porque
 * ninguém precisa lembrar de atualizá-la. A fonte da verdade passa a ser o único lugar que
 * não pode mentir — o arquivo que o produto importa.
 *
 * POR QUE O COMPILADOR E NÃO REGEX: TypeScript não é uma linguagem regular. `Array<{ a: b }>`
 * tem chave dentro de tipo, união quebra em várias linhas, JSDoc tem `{}` no meio do texto e
 * `@default` mora dentro do comentário. Regex acerta os casos fáceis e erra calado nos
 * difíceis — e errar calado é exatamente o defeito que este script existe para eliminar.
 * O compilador já resolve isso de graça e é a mesma engine que valida o código no CI.
 */

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../../..')
const COMPONENTES = resolve(RAIZ, 'packages/ui/src/components')
const SAIDA = resolve(AQUI, '../src/api-gerada.json')

const OPCOES = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
}

/** Uma linha por espaço: união multi-linha e JSDoc multi-linha viram texto de tabela. */
function achatar(texto) {
  return texto.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/^\|\s*/, '').trim()
}

/**
 * O compilador imprime literal com aspas duplas (`"sm" | "md"`), o código do projeto escreve
 * com aspas simples. Quem lê a doc vai copiar para um .tsx — então sai como o projeto escreve.
 */
function aspasDoProjeto(texto) {
  return texto.replace(/"/g, "'")
}

/**
 * O tipo COMO ESTÁ ESCRITO, com uma exceção: apelido nosso que é só uma união de valores
 * (`ButtonVariant`) é aberto, porque "variant: ButtonVariant" não responde a pergunta de quem
 * lê a tabela — "o que posso passar aqui?" — e obriga a ir caçar o apelido no código.
 *
 * A exceção para AÍ de propósito. Abrir `ReactNode` resolveria para dez linhas de união do
 * React (`string | number | Iterable<ReactNode> | Promise<AwaitedReactNode> | …`): tecnicamente
 * correto e ilegível. O corte é: abre se todos os membros forem valor (literal ou primitivo);
 * caso contrário o nome do tipo já é a melhor resposta.
 */
function textoDoTipo(no, checker) {
  const escrito = achatar(no.getText())
  if (!ts.isTypeReferenceNode(no)) return escrito

  const tipo = checker.getTypeAtLocation(no)
  const membros = tipo.isUnion() ? tipo.types : [tipo]
  const soValores = membros.every(m =>
    m.isLiteral() ||
    (m.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike |
      ts.TypeFlags.Null | ts.TypeFlags.Undefined)) !== 0,
  )
  if (!soValores || membros.length < 2) return escrito

  // Aqui o compilador decide SE abre, mas quem imprime é o código-fonte.
  //
  // `checker.typeToString` reordena os membros da união pela ordem interna em que o
  // compilador viu cada literal no programa inteiro — `StatTone` sai como
  // 'danger' | 'brand' | … quando o arquivo escreve 'brand' | 'success' | … | 'neutral'.
  // A ordem é decisão de quem escreveu (o padrão vem primeiro, o perigoso por último);
  // trocá-la seria a doc contando uma versão sutilmente diferente do código — exatamente
  // o defeito que este gerador existe para matar. Então, quando o apelido é nosso e já está
  // escrito como união, sai o texto do arquivo.
  const declaracao = checker.getSymbolAtLocation(no.typeName)?.declarations?.[0]
  if (declaracao && ts.isTypeAliasDeclaration(declaracao) &&
      (ts.isUnionTypeNode(declaracao.type) || ts.isLiteralTypeNode(declaracao.type))) {
    return achatar(declaracao.type.getText())
  }

  // Sobra o tipo derivado (`(typeof TONS_AVATAR)[number]`), que não tem união escrita para
  // copiar: aí o compilador é a única fonte. InTypeAlias porque sem ele ele imprime o
  // apelido de volta ("AvatarTom"), que é o que não queremos.
  const formato = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
  return aspasDoProjeto(achatar(checker.typeToString(tipo, undefined, formato)))
}

function jsdocTag(no, nomes) {
  const tag = ts.getJSDocTags(no).find(t => nomes.includes(t.tagName.text))
  if (!tag) return undefined
  const texto = typeof tag.comment === 'string' ? tag.comment : ts.displayPartsToString(tag.comment ?? [])
  return achatar(texto) || undefined
}

function descricaoDe(no, checker) {
  const simbolo = no.name && checker.getSymbolAtLocation(no.name)
  if (!simbolo) return undefined
  return achatar(ts.displayPartsToString(simbolo.getDocumentationComment(checker))) || undefined
}

function ehExportado(no) {
  return Boolean(no.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword))
}

function lerMembro(membro, checker) {
  if (!membro.name || !ts.isIdentifier(membro.name)) return null
  return {
    nome: membro.name.text,
    tipo: membro.type ? textoDoTipo(membro.type, checker) : 'unknown',
    obrigatoria: !membro.questionToken,
    // `@defaultValue` é o nome no TSDoc, `@default` no JSDoc clássico. O código usa os dois
    // conforme quem escreveu — a doc aceita ambos em vez de exigir que o código se adapte a ela.
    padrao: jsdocTag(membro, ['default', 'defaultValue']),
    descricao: descricaoDe(membro, checker),
  }
}

/**
 * Props PRÓPRIAS, e a herança citada numa linha.
 *
 * `extends ButtonHTMLAttributes<HTMLButtonElement>` traz umas 250 props do DOM (`onCopy`,
 * `autoCapitalize`, `inputMode`…). Listá-las seria "completo" e inútil: afogaria as 6 props que
 * são a decisão de design do componente no meio de um catálogo do HTML que a pessoa já conhece
 * e que o editor dela já autocompleta. Então a herança vira uma frase — "aceita também tudo de
 * <button>" — que é a informação que ela realmente precisa. Mesma escolha do MUI.
 */
function coletar(tipoNo, ctx, saida) {
  if (ts.isParenthesizedTypeNode(tipoNo)) return coletar(tipoNo.type, ctx, saida)

  if (ts.isTypeLiteralNode(tipoNo)) {
    for (const m of tipoNo.members) {
      if (!ts.isPropertySignature(m) && !ts.isMethodSignature(m)) continue
      const prop = lerMembro(m, ctx.checker)
      if (prop) saida.props.push(prop)
    }
    return
  }

  if (ts.isIntersectionTypeNode(tipoNo)) {
    for (const t of tipoNo.types) coletar(t, ctx, saida)
    return
  }

  // União = o componente tem variantes que não se misturam (Acordeao: `tipo="unico"` tem
  // `valor: string`, `tipo="multiplo"` tem `valor: string[]`). Mostra as duas e marca o
  // porquê, em vez de fundir num tipo que não existe.
  if (ts.isUnionTypeNode(tipoNo)) {
    saida.variantes = true
    for (const t of tipoNo.types) coletar(t, ctx, saida)
    return
  }

  if (ts.isTypeReferenceNode(tipoNo)) {
    const nome = tipoNo.typeName.getText()
    const local = ctx.interfaces.get(nome)
    // Interface nossa dentro do próprio pacote é composição interna, não herança do DOM:
    // as props são do componente e entram na tabela.
    if (local) return lerInterface(local, ctx, saida)
    saida.heranca.push(achatar(tipoNo.getText()))
  }
}

function lerInterface(no, ctx, saida) {
  for (const clausula of no.heritageClauses ?? []) {
    for (const t of clausula.types) {
      const nome = ts.isIdentifier(t.expression) ? t.expression.text : ''
      const local = ctx.interfaces.get(nome)
      if (local && !t.typeArguments) lerInterface(local, ctx, saida)
      else saida.heranca.push(achatar(t.getText()))
    }
  }
  for (const m of no.members) {
    if (!ts.isPropertySignature(m) && !ts.isMethodSignature(m)) continue
    const prop = lerMembro(m, ctx.checker)
    if (prop) saida.props.push(prop)
  }
}

function criarPrograma(fontes) {
  const virtuais = new Map(fontes.map(f => [resolve(f.caminho), f.texto]))
  const host = ts.createCompilerHost(OPCOES, true)
  const getSourceFile = host.getSourceFile.bind(host)
  const fileExists = host.fileExists.bind(host)
  const readFile = host.readFile.bind(host)

  host.getSourceFile = (nome, ...resto) => {
    const chave = resolve(nome)
    if (virtuais.has(chave)) {
      return ts.createSourceFile(nome, virtuais.get(chave) ?? '', ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX)
    }
    return getSourceFile(nome, ...resto)
  }
  host.fileExists = n => virtuais.has(resolve(n)) || fileExists(n)
  host.readFile = n => (virtuais.has(resolve(n)) ? virtuais.get(resolve(n)) : readFile(n))

  return { programa: ts.createProgram([...virtuais.keys()], OPCOES, host), virtuais }
}

/**
 * @param {{ caminho: string, texto: string }[]} fontes
 * @returns {Record<string, any>} catálogo por nome de componente
 */
export function extrairDeFontes(fontes) {
  const { programa, virtuais } = criarPrograma(fontes)
  const checker = programa.getTypeChecker()
  const arquivos = programa.getSourceFiles().filter(sf => virtuais.has(resolve(sf.fileName)))

  // Interfaces de todos os arquivos analisados, inclusive as não exportadas (`AcordeaoBase`):
  // um `type X = Base & {…}` só se descreve por inteiro se der para abrir a Base.
  const interfaces = new Map()
  for (const sf of arquivos) {
    ts.forEachChild(sf, no => {
      if (ts.isInterfaceDeclaration(no)) interfaces.set(no.name.text, no)
    })
  }
  const ctx = { checker, interfaces }

  const componentes = {}
  for (const sf of arquivos) {
    const arquivo = relative(RAIZ, resolve(sf.fileName))
    const exportsDoModulo = (() => {
      const s = checker.getSymbolAtLocation(sf)
      return s ? checker.getExportsOfModule(s) : []
    })()

    ts.forEachChild(sf, no => {
      const ehInterface = ts.isInterfaceDeclaration(no)
      const ehAlias = ts.isTypeAliasDeclaration(no)
      if ((!ehInterface && !ehAlias) || !ehExportado(no)) return

      const nomeTipo = no.name.text
      // `XxxProps` é a convenção do projeto para "a API do componente Xxx". Interfaces
      // auxiliares exportadas (StatDelta, ItemAcordeao) entram com o próprio nome: elas
      // aparecem na assinatura das props, então quem lê a tabela vai bater nelas.
      //
      // Apelido que não é `XxxProps` fica de fora: `export type ButtonVariant = 'primary' | …`
      // é um tipo de VALOR, não uma lista de props. Entrando, viraria uma linha de índice
      // com tabela vazia — a mentira silenciosa que este script existe para evitar.
      const chave = nomeTipo.endsWith('Props') ? nomeTipo.slice(0, -'Props'.length) : nomeTipo
      if (!chave || (ehAlias && !nomeTipo.endsWith('Props'))) return

      const saida = { nome: chave, tipo: nomeTipo, arquivo, heranca: [], props: [] }
      if (ehInterface) lerInterface(no, ctx, saida)
      else coletar(no.type, ctx, saida)

      // Dedup por nome+tipo: variante de união repete as props comuns (`children` do
      // AcordeaoBase apareceria duas vezes), mas `valor: string` e `valor: string[]` são
      // linhas diferentes e as duas ficam.
      const vistas = new Set()
      saida.props = saida.props.filter(p => {
        const id = `${p.nome}::${p.tipo}`
        if (vistas.has(id)) return false
        vistas.add(id)
        return true
      })
      saida.heranca = [...new Set(saida.heranca)]

      const doComponente = exportsDoModulo.find(s => s.getName() === chave)
      const descricao = doComponente
        ? achatar(ts.displayPartsToString(doComponente.getDocumentationComment(checker)))
        : ''
      if (descricao) saida.descricao = descricao

      componentes[chave] = saida
    })
  }

  return componentes
}

export function extrairDoPacote(dir = COMPONENTES) {
  const fontes = readdirSync(dir)
    .filter(n => n.endsWith('.tsx') && !n.endsWith('.test.tsx'))
    .map(n => ({ caminho: join(dir, n), texto: readFileSync(join(dir, n), 'utf8') }))
  return extrairDeFontes(fontes)
}

function main() {
  const componentes = extrairDoPacote()
  // Chaves ordenadas e sem carimbo de data/hora: o arquivo é versionado (o `dev` do vite não
  // roda o prebuild, e o tsc precisa dele), então ele só pode mudar quando a API muda de
  // verdade. Um timestamp sujaria o diff a cada build e ensinaria todo mundo a ignorá-lo.
  const ordenado = {}
  for (const chave of Object.keys(componentes).sort()) ordenado[chave] = componentes[chave]

  const json = {
    _aviso: 'Gerado por apps/docs/scripts/gerar-api.mjs a partir do código. Não edite à mão.',
    componentes: ordenado,
  }
  writeFileSync(SAIDA, JSON.stringify(json, null, 2) + '\n')

  const total = Object.values(ordenado).reduce((n, c) => n + c.props.length, 0)
  console.log(`[api] ${Object.keys(ordenado).length} componentes, ${total} props → ${relative(RAIZ, SAIDA)}`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main()
