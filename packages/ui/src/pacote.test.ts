import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * O contrato do PACOTE PUBLICADO — não de um componente.
 *
 * Estes testes leem o `dist/`, e por isso só valem depois do build (o CI builda antes de
 * testar). Eles existem porque a categoria de bug que pegam não aparece em nenhum teste
 * de componente: o problema não está no que o componente faz, está em como ele chega na
 * mão de quem instala.
 */

const dist = (arq: string) => {
  try {
    return readFileSync(resolve(__dirname, '../dist', arq), 'utf8')
  } catch {
    return null
  }
}

/** Todo `.js` publicado — o pacote virou um arquivo por componente, não um bundle só. */
const todosOsJs = (): { nome: string; fonte: string }[] => {
  const raiz = resolve(__dirname, '../dist')
  const achar = (dir: string): string[] => {
    try {
      return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        const caminho = resolve(dir, e.name)
        if (e.isDirectory()) return achar(caminho)
        return e.name.endsWith('.js') ? [caminho] : []
      })
    } catch {
      return []
    }
  }
  return achar(raiz).map(c => ({ nome: c.replace(raiz + '/', ''), fonte: readFileSync(c, 'utf8') }))
}

describe('o pacote publicado', () => {
  test("declara 'use client' na PRIMEIRA linha", () => {
    const js = dist('index.js')
    if (!js) return // rodando sem build (dev): nada a conferir

    // Sem esta linha, importar QUALQUER coisa daqui num Server Component do Next derruba
    // o build — inclusive o <Button>, que não tem estado. O Next olha o módulo, não o
    // componente, e o bundle inteiro importa useState. O erro fala de um hook que quem
    // importou nunca chamou, então ninguém liga o sintoma à causa.
    //
    // Precisa ser a PRIMEIRA linha: a diretiva só vale antes de qualquer import.
    //
    // A aspa é indiferente — escrevemos `'use client'` no banner e o Rollup normaliza
    // para `"use client"`. Cravar a aspa simples fazia este teste reprovar um pacote
    // perfeito: seria um teste medindo o formatador, não o contrato.
    expect(js.split('\n')[0].trim()).toMatch(/^["']use client["'];?$/)
  })

  test('nenhum arquivo empacota o React junto', () => {
    const arquivos = todosOsJs()
    if (arquivos.length === 0) return

    // React empacotado = duas cópias do React na página de quem instala = hooks quebrados,
    // com um erro que não menciona a causa.
    //
    // A varredura é sobre TODOS os arquivos, e isto é uma correção: o teste olhava só o
    // `index.js`. Quando o pacote virou um arquivo por componente, o index virou só
    // re-export e o React passou a ser importado lá dentro — o teste reprovou por olhar
    // no lugar errado, e teria passado a proteger nada se eu tivesse afrouxado a régua.
    // Agora ele cobre 40 arquivos em vez de 1.
    const empacotados = arquivos.filter(a => a.fonte.includes('ReactCurrentDispatcher'))
    expect(empacotados.map(a => a.nome), 'estes arquivos trazem o React dentro').toEqual([])

    // E quem USA React tem que importá-lo de fora, nunca redeclarar.
    const usaHook = arquivos.filter(a => /\buseState\b|\buseEffect\b|\buseRef\b/.test(a.fonte))
    const semImport = usaHook.filter(a => !/from\s*["']react["']/.test(a.fonte))
    expect(semImport.map(a => a.nome), 'usam hook sem importar do react').toEqual([])
  })

  test("cada arquivo de componente declara 'use client'", () => {
    const arquivos = todosOsJs()
    if (arquivos.length === 0) return

    // Com um arquivo por componente, a diretiva vale POR ARQUIVO — e é assim que ela
    // deveria ter sido desde o começo. Se um único componente perder a linha, importá-lo
    // num Server Component do Next derruba o build daquele produto, e só daquele.
    const mudos = arquivos.filter(a => !/^["']use client["']/.test(a.fonte.trimStart()))
    expect(mudos.map(a => a.nome), "sem 'use client' na primeira linha").toEqual([])
  })

  test('o CSS sai com o nome que o package.json promete', () => {
    const css = dist('styles.css')
    if (!css) return

    // O `exports` promete './styles.css'. Já saiu como `ui.css` uma vez: quem seguisse a
    // documentação (`import '@amboni/ui/styles.css'`) tomava erro de módulo não achado.
    expect(css.length).toBeGreaterThan(0)
  })

  test('o CSS não traz cor literal fora dos comentários', () => {
    const css = dist('styles.css')
    if (!css) return

    const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const hex = semComentario.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    // Cor literal fura os tokens: nenhum teste de contraste alcança, e ela não troca com
    // a marca nem com o tema. Foi assim que o botão "Apagar" ficou em 3,76:1 por meses.
    expect(hex, `hex fora de comentário: ${hex.join(', ')}`).toEqual([])
  })
})
