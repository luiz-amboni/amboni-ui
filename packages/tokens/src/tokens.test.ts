import { describe, test, expect } from 'vitest'
import { contraste, relatorio, WCAG, hexParaRgb } from './contraste.js'
import { construirTema, MARCAS, type Marca } from './semantic.js'
import { paleta, espaco, raio } from './primitives.js'

/**
 * Estes testes são o CONTRATO da biblioteca.
 *
 * Se alguém trocar um token por uma cor bonita porém ilegível, o build quebra aqui —
 * antes de chegar em qualquer produto. É o que impede o design system de virar
 * "uma pasta de cores que alguém achou legal".
 */

const MARCAS_NOMES = Object.keys(MARCAS) as Marca[]
const MODOS = ['light', 'dark'] as const

describe('contraste — a matemática', () => {
  test('preto sobre branco é 21:1 (o máximo possível)', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  test('cor igual é 1:1', () => {
    expect(contraste('#0fa6be', '#0fa6be')).toBeCloseTo(1, 5)
  })

  test('é simétrico — a ordem não muda a razão', () => {
    expect(contraste('#0fa6be', '#ffffff')).toBeCloseTo(contraste('#ffffff', '#0fa6be'), 5)
  })

  test('aceita hex de 3 dígitos', () => {
    expect(hexParaRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  test('hex inválido é bug — deve lançar, não devolver preto silenciosamente', () => {
    expect(() => hexParaRgb('vermelho')).toThrow()
    expect(() => hexParaRgb('#12')).toThrow()
  })
})

// ── O contrato de acessibilidade de cada tema ────────────────────────────────

describe.each(MARCAS_NOMES)('tema %s', marca => {
  describe.each(MODOS)('modo %s', modo => {
    const t = construirTema(marca, modo)

    test('texto primário passa em AA sobre o fundo da página', () => {
      const r = relatorio(t.color.text.primary, t.color.bg)
      expect(r.passa, `primary sobre bg: ${r.razao}:1 (mín ${r.minimo})`).toBe(true)
    })

    test('texto primário passa em AA sobre card', () => {
      const r = relatorio(t.color.text.primary, t.color.surface)
      expect(r.passa, `primary sobre surface: ${r.razao}:1`).toBe(true)
    })

    test('texto secundário passa em AA sobre card (é texto de verdade, não decoração)', () => {
      const r = relatorio(t.color.text.secondary, t.color.surface)
      expect(r.passa, `secondary sobre surface: ${r.razao}:1`).toBe(true)
    })

    test('texto secundário passa em AA sobre o fundo da página', () => {
      const r = relatorio(t.color.text.secondary, t.color.bg)
      expect(r.passa, `secondary sobre bg: ${r.razao}:1`).toBe(true)
    })

    // ── `muted` já valeu 3:1 aqui. Não vale mais. ────────────────────────────
    // A régua antiga era "muted é discreto, 3:1 basta". Com ela o escuro ficava em
    // 3,75:1 e passava. Mas `muted` pinta o motivo de um valor estar ausente ("precisa
    // de vendas atribuídas") — texto normal que INFORMA, e a WCAG 1.4.3 pede 4,5:1 sem
    // carve-out para "discreto": a isenção cobre texto incidental e controle
    // desabilitado, e nenhum dos dois é este caso. Quem mais precisa dessa frase é
    // justamente quem não está enxergando o número.
    //
    // Os dois fundos são testados de propósito: o furo anterior era cobrir só o card e
    // não o fundo da página, onde o mesmo cinza rende menos.
    test.each([
      ['card', () => t.color.surface],
      ['fundo da página', () => t.color.bg],
    ])('texto muted passa em AA sobre %s — ele informa, não decora', (_onde, bg) => {
      const r = relatorio(t.color.text.muted, bg())
      expect(r.passa, `muted: ${r.razao}:1 (mín ${r.minimo})`).toBe(true)
    })

    test('a hierarquia de texto é visível: primary > secondary > muted', () => {
      // Três tokens que passam no contraste mas rendem quase o mesmo não são hierarquia,
      // são três cinzas iguais. Se colapsarem, isto reprova antes de virar design.
      const c = (cor: string) => contraste(cor, t.color.surface)
      expect(c(t.color.text.primary)).toBeGreaterThan(c(t.color.text.secondary))
      expect(c(t.color.text.secondary)).toBeGreaterThan(c(t.color.text.muted))
    })

    test('texto sobre a marca cheia passa em AA (o botão primário precisa ser legível)', () => {
      const r = relatorio(t.color.text.onBrand, t.color.brand.solid)
      expect(r.passa, `onBrand sobre brand.solid: ${r.razao}:1`).toBe(true)
    })

    test('texto da marca passa em AA sobre card', () => {
      const r = relatorio(t.color.brand.text, t.color.surface)
      expect(r.passa, `brand.text sobre surface: ${r.razao}:1`).toBe(true)
    })

    test('anel de foco é visível sobre o fundo (acessibilidade de teclado)', () => {
      const r = relatorio(t.color.border.focus, t.color.surface, WCAG.AA_NAO_TEXTO)
      expect(r.passa, `border.focus sobre surface: ${r.razao}:1 (mín 3)`).toBe(true)
    })

    test.each(['success', 'warning', 'danger', 'info'] as const)(
      'texto de %s passa em AA sobre card',
      estado => {
        const r = relatorio(t.color[estado].text, t.color.surface)
        expect(r.passa, `${estado}.text sobre surface: ${r.razao}:1`).toBe(true)
      },
    )
  })
})

describe('temas — estrutura', () => {
  test('trocar a marca muda a cor da marca, e SÓ ela', () => {
    const isafe = construirTema('isafe', 'light')
    const vear = construirTema('vear', 'light')

    expect(isafe.color.brand.solid).not.toBe(vear.color.brand.solid)
    // O resto do sistema é idêntico — é isso que faz um componente servir aos dois.
    expect(isafe.color.text.primary).toBe(vear.color.text.primary)
    expect(isafe.color.bg).toBe(vear.color.bg)
    expect(isafe.color.danger.solid).toBe(vear.color.danger.solid)
  })

  test('claro e escuro têm fundos opostos', () => {
    const claro = construirTema('isafe', 'light')
    const escuro = construirTema('isafe', 'dark')
    expect(contraste(claro.color.bg, escuro.color.bg)).toBeGreaterThan(10)
  })

  test('todo tema define todos os tokens (nada undefined vazando pro CSS)', () => {
    for (const m of MARCAS_NOMES) {
      for (const modo of MODOS) {
        const t = construirTema(m, modo)
        const achatar = (o: object, p = ''): string[] =>
          Object.entries(o).flatMap(([k, v]) =>
            typeof v === 'object' && v !== null ? achatar(v, `${p}${k}.`) : [`${p}${k}=${v}`],
          )
        for (const par of achatar(t)) {
          expect(par, `${m}/${modo}: ${par}`).not.toMatch(/=(undefined|null|)$/)
        }
      }
    }
  })
})

describe('escalas primitivas', () => {
  test('toda escala tem os 11 degraus, do 50 ao 950', () => {
    const esperados = ['50','100','200','300','400','500','600','700','800','900','950']
    for (const [nome, escala] of Object.entries(paleta)) {
      expect(Object.keys(escala), `escala ${nome}`).toEqual(esperados)
    }
  })

  test('escalas vão do claro para o escuro, sem inversão', () => {
    // Um degrau fora de ordem quebra a intuição de quem usa (e vira bug visual).
    for (const [nome, escala] of Object.entries(paleta)) {
      const contra = Object.values(escala).map(c => contraste(c, '#ffffff'))
      for (let i = 1; i < contra.length; i++) {
        expect(contra[i], `${nome}: degrau ${i} deveria ser mais escuro que o anterior`)
          .toBeGreaterThan(contra[i - 1])
      }
    }
  })

  test('a marca do iSafe é o ciano que já está no CRM', () => {
    expect(paleta.cyan[500]).toBe('#0fa6be')
  })

  test('a marca do VEAR é o roxo original', () => {
    expect(paleta.purple[700]).toBe('#5c2684')
  })

  test('espaçamento é múltiplo de 4px — grade consistente', () => {
    for (const [passo, v] of Object.entries(espaco)) {
      if (v === '0') continue
      const px = parseFloat(v) * 16
      expect(px % 4, `espaco.${passo} = ${v} (${px}px) não é múltiplo de 4`).toBe(0)
    }
  })

  test('raio full é pílula', () => {
    expect(raio.full).toBe('9999px')
  })
})
