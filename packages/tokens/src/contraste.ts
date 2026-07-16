/**
 * Contraste WCAG 2.1 — cálculo, não opinião.
 *
 * Ninguém deve "achar" que um par de cores é legível. Aqui a conta é feita e o teste
 * quebra o build se um token da biblioteca reprovar. É o que garante que ninguém com
 * baixa visão fique sem ler o sistema — e é obrigação legal em muitos contextos.
 *
 * Referência: https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

export interface RGB { r: number; g: number; b: number }

/** #rgb, #rrggbb → {r,g,b} 0-255. Lança em entrada inválida (é bug, não caso de borda). */
export function hexParaRgb(hex: string): RGB {
  const h = hex.trim().replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Hex inválido: ${hex}`)
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/**
 * Luminância relativa (WCAG). Não é "o quão claro parece" — é a fórmula da norma,
 * com correção de gama por canal.
 */
export function luminancia({ r, g, b }: RGB): number {
  const canal = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

/** Razão de contraste entre duas cores: de 1 (igual) a 21 (preto x branco). */
export function contraste(corA: string, corB: string): number {
  const a = luminancia(hexParaRgb(corA))
  const b = luminancia(hexParaRgb(corB))
  const [claro, escuro] = a > b ? [a, b] : [b, a]
  return (claro + 0.05) / (escuro + 0.05)
}

/** Mínimos da norma. */
export const WCAG = {
  /** Texto normal, nível AA. O piso de qualquer texto legível. */
  AA_TEXTO: 4.5,
  /** Texto grande (≥18.66px bold ou ≥24px), nível AA. */
  AA_TEXTO_GRANDE: 3,
  /** Componentes de interface: borda de campo, ícone, anel de foco. */
  AA_NAO_TEXTO: 3,
  /** Nível AAA — mais rigoroso. */
  AAA_TEXTO: 7,
} as const

export function passa(corA: string, corB: string, minimo: number = WCAG.AA_TEXTO): boolean {
  return contraste(corA, corB) >= minimo
}

/** Relatório legível — usado no teste e no site de documentação. */
export function relatorio(fg: string, bg: string, minimo: number = WCAG.AA_TEXTO) {
  const razao = contraste(fg, bg)
  return {
    fg, bg,
    razao: Math.round(razao * 100) / 100,
    minimo,
    passa: razao >= minimo,
    nivel: razao >= WCAG.AAA_TEXTO ? 'AAA' : razao >= WCAG.AA_TEXTO ? 'AA' : razao >= WCAG.AA_NAO_TEXTO ? 'AA-grande' : 'reprovado',
  }
}
