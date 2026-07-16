import { describe, test, expect } from 'vitest'
import { realcar } from './highlight'

describe('realce — segurança', () => {
  test('escapa HTML: código não vira markup', () => {
    // Se isto falhar, o site executa o que está no bloco de código.
    const r = realcar('<img onerror="x">')
    expect(r).not.toContain('<img')
    expect(r).toContain('&lt;img')
  })

  test('escapa & antes de < (senão o &lt; vira &amp;lt;)', () => {
    expect(realcar('a && b')).toContain('&amp;&amp;')
  })
})

describe('realce — não se autodestrói', () => {
  test('NÃO colore o class="" dos spans que ele mesmo inseriu', () => {
    // O bug: a versão ingênua fazia um .replace() por regra, em sequência. A regra de
    // atributo encontrava o class= do <span class="tok-str"> inserido pela regra de
    // string e coloria o próprio realce, gerando HTML aninhado sem sentido.
    const r = realcar(`const x = 'oi'`)
    expect(r).not.toContain('<span class="tok-attr">class</span>')
    // um span por token, nenhum span dentro de span
    expect(r).not.toMatch(/<span[^>]*><span/)
  })

  test('conteúdo de comentário não é lido como código', () => {
    const r = realcar('// use <Button> aqui')
    expect(r).toBe('<span class="tok-com">// use &lt;Button&gt; aqui</span>')
  })

  test('conteúdo de string não é lido como código', () => {
    const r = realcar(`'import from const'`)
    expect(r).toBe(`<span class="tok-str">'import from const'</span>`)
  })
})

describe('realce — jsx', () => {
  test('marca componente (maiúscula), não tag html', () => {
    expect(realcar('<Button>')).toContain('tok-tag')
    // <div> minúsculo não é componente da biblioteca — não merece destaque
    expect(realcar('<div>')).not.toContain('tok-tag')
  })

  test('marca palavra-chave, atributo e número', () => {
    const r = realcar('import x from "y"')
    expect(r).toContain('<span class="tok-kw">import</span>')

    expect(realcar('size={3}')).toContain('<span class="tok-num">3</span>')
    expect(realcar('variant="ghost"')).toContain('<span class="tok-attr">variant</span>')
  })

  test('"import" dentro de palavra não é palavra-chave', () => {
    expect(realcar('importante')).not.toContain('tok-kw')
  })
})

describe('realce — css', () => {
  test('marca variável, função e cor', () => {
    const r = realcar('color: var(--amb-color-bg);', 'css')
    expect(r).toContain('<span class="tok-kw">var</span>')
    expect(r).toContain('<span class="tok-attr">--amb-color-bg</span>')

    expect(realcar('color: #0FA6BE;', 'css')).toContain('<span class="tok-num">#0FA6BE</span>')
  })
})

describe('realce — não perde texto', () => {
  test.each([
    `const a = 'x'`,
    `<Button variant="primary" size={2}>Salvar</Button>`,
    `// comentário\nconst b = 1`,
    ``,
    `texto sem nada especial`,
  ])('o texto visível sobrevive: %j', codigo => {
    // Remove as tags e desescapa: tem que voltar exatamente ao original. É a garantia
    // de que nenhum trecho foi engolido entre um match e outro.
    const texto = realcar(codigo)
      .replace(/<\/?span[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(texto).toBe(codigo)
  })
})
