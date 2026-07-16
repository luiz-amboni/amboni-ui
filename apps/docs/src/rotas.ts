import type { ComponentType } from 'react'
import Inicio from './paginas/Inicio'
import Instalacao from './paginas/Instalacao'
import Cores from './paginas/Cores'
import Tipografia from './paginas/Tipografia'
import Espacamento from './paginas/Espacamento'
import Acessibilidade from './paginas/Acessibilidade'
import ButtonPage from './paginas/ButtonPage'
import CardPage from './paginas/CardPage'
import StatCardPage from './paginas/StatCardPage'

export interface Pagina {
  slug: string
  titulo: string
  grupo: string
  selo?: string
  componente: ComponentType
}

/**
 * A ordem aqui É a ordem do menu, e o primeiro item é o destino de qualquer rota
 * desconhecida. Sem router: um site de nove páginas não justifica a dependência.
 */
export const PAGINAS: Pagina[] = [
  { slug: 'inicio', titulo: 'Visão geral', grupo: 'Começar', componente: Inicio },
  { slug: 'instalacao', titulo: 'Instalação', grupo: 'Começar', componente: Instalacao },

  { slug: 'cores', titulo: 'Cores', grupo: 'Fundamentos', componente: Cores },
  { slug: 'tipografia', titulo: 'Tipografia', grupo: 'Fundamentos', componente: Tipografia },
  { slug: 'espacamento', titulo: 'Espaço e forma', grupo: 'Fundamentos', componente: Espacamento },
  { slug: 'acessibilidade', titulo: 'Acessibilidade', grupo: 'Fundamentos', selo: 'testado', componente: Acessibilidade },

  { slug: 'button', titulo: 'Button', grupo: 'Componentes', componente: ButtonPage },
  { slug: 'card', titulo: 'Card', grupo: 'Componentes', componente: CardPage },
  { slug: 'statcard', titulo: 'StatCard', grupo: 'Componentes', componente: StatCardPage },
]
