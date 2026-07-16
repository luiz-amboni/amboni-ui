/**
 * CAMADA 1 — PRIMITIVOS
 * ═════════════════════════════════════════════════════════════════════════════
 * Os valores crus. Um primitivo NÃO tem opinião sobre uso: `cyan[500]` é só uma cor,
 * não é "a cor da marca". Quem dá significado é a camada semântica.
 *
 * REGRA: nenhum componente importa daqui. Se um botão usar `cyan[500]` direto, trocar
 * a marca vira busca-e-substitui — exatamente o problema que esta biblioteca resolve
 * (o VEAR hoje tem 522 cores cravadas, 313 só do roxo).
 *
 * As escalas vão de 50 (mais claro) a 950 (mais escuro), com o 500 sendo o tom "cheio".
 * Os passos são pensados para que 600+ passe em contraste 4.5:1 sobre branco, e 400-
 * sobre preto — verificado por script (npm test).
 */

export type Escala = {
  50: string; 100: string; 200: string; 300: string; 400: string
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string
}

/** Ciano/petróleo — marca do iSafe. O 500 é o #0FA6BE que já está no CRM. */
export const cyan: Escala = {
  50:  '#ecfeff',
  100: '#cff8fd',
  200: '#a5eff9',
  300: '#67e0f2',
  400: '#22c6e3',
  500: '#0fa6be', // ← marca iSafe
  600: '#0c86a0',
  700: '#106b81',
  800: '#165869',
  900: '#164a59',
  950: '#083040',
}

/** Roxo — marca do VEAR. O #5c2684 original é escuro: ancorado no 700. */
export const purple: Escala = {
  50:  '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d6b4fe',
  400: '#b985f5',
  500: '#9553e8',
  600: '#7a35cf',
  700: '#5c2684', // ← marca VEAR
  800: '#4b1f6b',
  900: '#3a1852',
  950: '#250f36',
}

/** Rosa — apoio da marca VEAR (#e6007e no original). */
export const pink: Escala = {
  50:  '#fdf2f9',
  100: '#fce7f5',
  200: '#fbcfeb',
  300: '#f9a8d8',
  400: '#f472ba',
  500: '#e6007e', // ← apoio VEAR
  600: '#c7006c',
  700: '#a30058',
  800: '#860449',
  900: '#70073f',
  950: '#450022',
}

/** Neutros — a cor mais usada de qualquer interface (fundo, texto, borda). */
export const slate: Escala = {
  50:  '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
}

/** Verde — sucesso, "deu certo", positivo. */
export const green: Escala = {
  50:  '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
}

/** Âmbar — atenção, "olha isso", cuidado. */
export const amber: Escala = {
  50:  '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
}

/** Vermelho — erro, perigo, destrutivo. */
export const red: Escala = {
  50:  '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
}

/** Azul — informação neutra. Nunca use para "sucesso". */
export const blue: Escala = {
  50:  '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
}

export const paleta = { cyan, purple, pink, slate, green, amber, red, blue }
export type NomePaleta = keyof typeof paleta

// ── Escalas não-cromáticas ───────────────────────────────────────────────────

/**
 * Espaçamento em passos de 4px. Escala limitada DE PROPÓSITO: quando tudo é possível,
 * nada é consistente. Se falta um valor, quase sempre o layout é que está errado.
 */
export const espaco = {
  0: '0',
  1: '0.25rem', //  4px
  2: '0.5rem',  //  8px
  3: '0.75rem', // 12px
  4: '1rem',    // 16px
  5: '1.25rem', // 20px
  6: '1.5rem',  // 24px
  8: '2rem',    // 32px
  10: '2.5rem', // 40px
  12: '3rem',   // 48px
  16: '4rem',   // 64px
  20: '5rem',   // 80px
  24: '6rem',   // 96px
} as const

/**
 * Cantos. A escala foi aberta depois de MEDIR a referência (o CRM da Bevean): controles
 * de 48px com 9,6px de raio. O 8px anterior, na mesma altura, lia como "quadrado com o
 * canto lixado" — o bastante para a interface parecer datada sem ninguém saber apontar
 * o motivo. É o upgrade de aparência mais barato que existe.
 */
export const raio = {
  none: '0',
  sm: '0.375rem', //  6px — selo, caixa de seleção
  md: '0.625rem', // 10px — padrão de botão/campo
  lg: '0.875rem', // 14px — padrão de card
  xl: '1.25rem',  // 20px — modal, painel
  full: '9999px', // pílula/círculo
} as const

/**
 * Altura dos controles. Mora aqui, e não solta no CSS de cada componente, porque botão,
 * campo, select e combo PRECISAM bater no milímetro: um formulário com o botão 4px mais
 * baixo que o campo ao lado é o tipo de desalinho que ninguém reporta e todo mundo
 * sente. Um token, todos alinhados.
 *
 * Os 44px do padrão saem da referência (48px lá) puxados para o alvo de toque de 44px
 * do iOS — o menor tamanho que ainda se acerta com o dedo em movimento.
 */
export const alturaControle = {
  sm: '2.25rem', // 36px
  md: '2.75rem', // 44px
  lg: '3.25rem', // 52px
} as const

/** Sombras discretas: elevação se sugere, não se grita. */
export const sombra = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
  md: '0 2px 8px -1px rgb(15 23 42 / 0.08), 0 1px 3px -1px rgb(15 23 42 / 0.06)',
  lg: '0 8px 24px -4px rgb(15 23 42 / 0.10), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
  xl: '0 20px 40px -8px rgb(15 23 42 / 0.16)',
} as const

/**
 * Manrope no lugar de Inter + Sora, depois de medir a referência (Bevean usa Manrope em
 * tudo). Duas razões, e a segunda é a que pesa:
 *
 * 1. A Inter é a fonte-padrão de "app feito por dev" — correta, onipresente, sem
 *    memória. A Manrope é geométrica e de terminações arredondadas: conversa com o raio
 *    de 10px em vez de brigar com ele.
 * 2. UMA família em vez de duas. Sora só aparecia em título e ainda assim custava um
 *    arquivo inteiro de fonte. A Manrope vai de 400 a 800 e cobre corpo e título — menos
 *    bytes, menos decisão, e a página deixa de ter dois "temperamentos" tipográficos.
 *
 * `display` continua existindo e apontando para a mesma família: quem já escreveu
 * var(--amb-fonte-display) não quebra, e um dia dá para divergir de novo sem caçar uso.
 */
export const fonte = {
  sans: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  /** Títulos. Hoje é a mesma família do corpo, em peso maior. */
  display: "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif",
  /** Números em tabela e código. */
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const

export const tamanhoFonte = {
  xs: '0.75rem',    // 12
  sm: '0.8125rem',  // 13
  base: '0.875rem', // 14 — corpo padrão de painel (não 16: densidade de dados)
  md: '1rem',       // 16
  lg: '1.125rem',   // 18
  xl: '1.375rem',   // 22
  '2xl': '1.75rem', // 28
  '3xl': '2.25rem', // 36
} as const

export const peso = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export const alturaLinha = {
  tight: '1.2',
  snug: '1.4',
  normal: '1.6',
} as const

/**
 * Movimento. Rápido o bastante para não atrasar, lento o bastante para o olho seguir.
 * Acima de 300ms a interface começa a parecer lenta.
 */
export const duracao = {
  instant: '80ms',
  fast: '140ms',
  normal: '200ms',
  slow: '300ms',
} as const

export const easing = {
  /** Padrão: sai rápido, chega suave. */
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  entrada: 'cubic-bezier(0, 0, 0.2, 1)',
  saida: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

/** Camadas. Números nomeados evitam a guerra de z-index: 9999. */
export const camada = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  overlay: '1300',
  modal: '1400',
  popover: '1500',
  toast: '1700',
  tooltip: '1800',
} as const
