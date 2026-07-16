import { cyan, purple, slate, green, amber, red, blue, type Escala } from './primitives.js'

/**
 * CAMADA 2 — SEMÂNTICA
 * ═════════════════════════════════════════════════════════════════════════════
 * Aqui o valor cru ganha SIGNIFICADO. Os componentes usam só esta camada.
 *
 * A diferença entre `cyan[500]` e `color.brand` parece boba, mas é ela que permite:
 *   · trocar a marca (iSafe ciano / VEAR roxo) sem tocar em nenhum componente;
 *   · ter modo claro e escuro sem `if` espalhado pela interface;
 *   · alguém ler o código e entender a INTENÇÃO ("é a cor de perigo") em vez do valor.
 *
 * Regra de ouro do naming: o nome diz PARA QUE SERVE, nunca como é.
 *   ✅ color.text.muted     ❌ color.cinzaClaro
 *   ✅ color.danger.bg      ❌ color.vermelho100
 */

export interface TokensSemanticos {
  color: {
    /** Fundo da página (o mais atrás de tudo). */
    bg: string
    /** Superfície elevada: card, painel, modal. */
    surface: string
    /** Superfície um passo acima (linha de tabela em hover, cabeçalho). */
    surfaceRaised: string
    /** Fundo sutil para faixa/realce dentro de um card. */
    surfaceSunken: string

    text: {
      /** Texto principal. Sempre o de maior contraste. */
      primary: string
      /** Rótulo, apoio, legenda. */
      secondary: string
      /** Placeholder, valor ausente, texto desligado. NUNCA para informação essencial. */
      muted: string
      /** Texto sobre fundo colorido cheio (ex.: dentro de um botão da marca). */
      onBrand: string
    }

    border: {
      /** Divisor padrão (borda de card, linha de tabela). */
      default: string
      /** Borda de campo/controle — precisa ser visível. */
      strong: string
      /** Anel de foco. Acessibilidade: nunca remova sem colocar outro. */
      focus: string
    }

    /** A cor da marca. É a ÚNICA coisa que muda entre iSafe e VEAR. */
    brand: {
      /** Cor cheia: fundo de botão primário, barra ativa. */
      solid: string
      /** Cor cheia em hover. */
      solidHover: string
      /** Fundo tingido para realce discreto (ícone, selo). */
      subtle: string
      /** Texto/ícone na cor da marca sobre fundo claro — passa em contraste. */
      text: string
    }

    /** Estados. NUNCA use como "cor da série 4" de um gráfico. */
    success: EstadoCor
    warning: EstadoCor
    danger: EstadoCor
    info: EstadoCor
  }
  shadow: { sm: string; md: string; lg: string; xl: string }
}

export interface EstadoCor {
  solid: string
  subtle: string
  text: string
  border: string
}

/** Constrói o bloco de um estado a partir de uma escala. */
const estado = (e: Escala, claro: boolean): EstadoCor =>
  claro
    ? { solid: e[500], subtle: e[50], text: e[700], border: e[200] }
    : { solid: e[500], subtle: 'color-mix(in srgb, ' + e[500] + ' 14%, transparent)', text: e[400], border: 'color-mix(in srgb, ' + e[500] + ' 40%, transparent)' }

/**
 * Constrói o bloco da marca.
 *
 * ⚠️ POR QUE `solid` NÃO É O 500 (a cor "pura" da marca) NO MODO CLARO:
 * o teste de contraste reprovou. Texto branco sobre o ciano #0fa6be dá 2,91:1 — o
 * mínimo da norma é 4,5:1. Ou seja: o botão primário do iSafe HOJE é ilegível para
 * quem tem baixa visão. Medido, não achado. O primeiro degrau que passa é o 700 (6,10:1).
 *
 * A marca continua sendo o 500 — ela vive em `subtle`, em ícone e em realce, onde o
 * contraste exigido é menor. Mas quando vira FUNDO DE TEXTO, tem que escurecer.
 * Identidade não vale mais que legibilidade.
 *
 * No modo escuro é o oposto: o fundo é escuro, então a marca clareia (400) e o texto
 * em cima dela fica escuro — ver `text.onBrand`.
 */
const marca = (e: Escala, claro: boolean) =>
  claro
    ? { solid: e[700], solidHover: e[800], subtle: e[50], text: e[700] }
    : { solid: e[400], solidHover: e[300], subtle: 'color-mix(in srgb, ' + e[400] + ' 16%, transparent)', text: e[300] }

/** Marcas disponíveis. Adicionar um cliente novo = uma linha aqui. */
export const MARCAS = { isafe: cyan, vear: purple } as const
export type Marca = keyof typeof MARCAS

export function construirTema(marcaNome: Marca, modo: 'light' | 'dark'): TokensSemanticos {
  const b = MARCAS[marcaNome]
  const claro = modo === 'light'

  return {
    color: {
      bg: claro ? slate[50] : slate[950],
      surface: claro ? '#ffffff' : slate[900],
      surfaceRaised: claro ? slate[50] : slate[800],
      surfaceSunken: claro ? slate[100] : '#0b1220',

      text: {
        primary: claro ? slate[900] : slate[100],
        // O escuro desce um degrau a mais que o claro (300, não 400) para abrir espaço:
        // com o secondary em 400, o muted não teria para onde ir sem reprovar.
        secondary: claro ? slate[600] : slate[300],
        // slate[400] dava 2,56:1 sobre branco — reprovado até no piso de 3:1.
        // Placeholder ilegível não é "discreto", é inacessível. slate[500] = 4,76:1.
        //
        // O escuro NÃO herda o slate[500] do claro: sobre o card escuro ele dá 3,75:1.
        // Isso passava no piso antigo de 3:1 e reprovava na régua real (4,5:1 para texto
        // normal) — e `muted` pinta texto que informa, como o "precisa de vendas
        // atribuídas" do StatCard. Quem mais precisa dessa frase é justamente quem não
        // está enxergando o número. slate[400] = 6,96:1.
        muted: claro ? slate[500] : slate[400],
        // Sobre a marca cheia: no claro a marca é escura (texto branco); no escuro a
        // marca é clara (texto escuro). Sem isso, botão primário fica ilegível no escuro.
        onBrand: claro ? '#ffffff' : slate[950],
      },

      border: {
        default: claro ? slate[200] : slate[800],
        strong: claro ? slate[300] : slate[700],
        // O anel de foco é a única pista de quem navega por teclado. b[500] dava
        // 2,91:1 sobre branco (mín. 3:1 para não-texto). b[600] = 4,26:1.
        focus: claro ? b[600] : b[400],
      },

      brand: marca(b, claro),

      success: estado(green, claro),
      warning: estado(amber, claro),
      danger: estado(red, claro),
      info: estado(blue, claro),
    },
    shadow: claro
      ? {
          sm: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
          md: '0 2px 8px -1px rgb(15 23 42 / 0.08), 0 1px 3px -1px rgb(15 23 42 / 0.06)',
          lg: '0 8px 24px -4px rgb(15 23 42 / 0.10), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
          xl: '0 20px 40px -8px rgb(15 23 42 / 0.16)',
        }
      : {
          // No escuro, sombra preta some. Elevação vem de sombra mais densa + borda.
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.30)',
          md: '0 2px 8px -1px rgb(0 0 0 / 0.40)',
          lg: '0 8px 24px -4px rgb(0 0 0 / 0.50)',
          xl: '0 20px 40px -8px rgb(0 0 0 / 0.60)',
        },
  }
}
