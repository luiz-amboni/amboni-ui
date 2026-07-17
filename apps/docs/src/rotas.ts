import type { ComponentType } from 'react'
import Inicio from './paginas/Inicio'
import Instalacao from './paginas/Instalacao'
import Cores from './paginas/Cores'
import Tipografia from './paginas/Tipografia'
import Espacamento from './paginas/Espacamento'
import Acessibilidade from './paginas/Acessibilidade'
import TokensPage from './paginas/TokensPage'

import GuiaTypeScriptPage from './paginas/GuiaTypeScriptPage'
import GuiaFormulariosPage from './paginas/GuiaFormulariosPage'
import GuiaTestesPage from './paginas/GuiaTestesPage'
import GuiaSSRPage from './paginas/GuiaSSRPage'
import GuiaTemaPage from './paginas/GuiaTemaPage'
import GuiaIconesPage from './paginas/GuiaIconesPage'
import GuiaMuiPage from './paginas/GuiaMuiPage'
import GuiaTailwindPage from './paginas/GuiaTailwindPage'

import ButtonPage from './paginas/ButtonPage'
import MenuPage from './paginas/MenuPage'

import CampoFormPage from './paginas/CampoFormPage'
import CampoPage from './paginas/CampoPage'
import AreaTextoPage from './paginas/AreaTextoPage'
import SelecaoPage from './paginas/SelecaoPage'
import CaixaPage from './paginas/CaixaPage'

import CardPage from './paginas/CardPage'
import StatCardPage from './paginas/StatCardPage'
import TabelaPage from './paginas/TabelaPage'
import EstadoVazioPage from './paginas/EstadoVazioPage'

import SeloPage from './paginas/SeloPage'
import AvatarPage from './paginas/AvatarPage'

import AlertaPage from './paginas/AlertaPage'
import AvisoPage from './paginas/AvisoPage'
import CarregandoPage from './paginas/CarregandoPage'

import DialogoPage from './paginas/DialogoPage'
import DicaPage from './paginas/DicaPage'

import AbasPage from './paginas/AbasPage'
import AcordeaoPage from './paginas/AcordeaoPage'
import TrilhaPage from './paginas/TrilhaPage'
import PaginacaoPage from './paginas/PaginacaoPage'

import ExemploLoginPage from './paginas/ExemploLoginPage'
import ExemploDashboardPage from './paginas/ExemploDashboardPage'
import ExemploCrmPage from './paginas/ExemploCrmPage'
import ExemploFormularioPage from './paginas/ExemploFormularioPage'

export interface Pagina {
  slug: string
  titulo: string
  grupo: string
  selo?: string
  componente: ComponentType
}

/**
 * A ordem aqui É a ordem do menu, e o primeiro item é o destino de qualquer rota
 * desconhecida. Sem router: um site de vinte e poucas páginas não justifica a
 * dependência — `hashchange` do navegador resolve, e é o que o App.tsx escuta.
 *
 * Os grupos batem com os do `index.ts` da biblioteca de propósito: quem procura "como
 * mostro um erro" acha a família inteira no mesmo lugar, no menu e no import.
 */
export const PAGINAS: Pagina[] = [
  { slug: 'inicio', titulo: 'Visão geral', grupo: 'Começar', componente: Inicio },
  { slug: 'instalacao', titulo: 'Instalação', grupo: 'Começar', componente: Instalacao },

  { slug: 'cores', titulo: 'Cores', grupo: 'Fundamentos', componente: Cores },
  { slug: 'tipografia', titulo: 'Tipografia', grupo: 'Fundamentos', componente: Tipografia },
  { slug: 'espacamento', titulo: 'Espaço e forma', grupo: 'Fundamentos', componente: Espacamento },
  { slug: 'acessibilidade', titulo: 'Acessibilidade', grupo: 'Fundamentos', selo: 'testado', componente: Acessibilidade },
  { slug: 'tokens', titulo: 'Todos os tokens', grupo: 'Fundamentos', componente: TokensPage },

  // Exemplos vêm cedo de propósito: componente isolado não prova nada. Quem está
  // decidindo se adota a biblioteca quer ver uma tela inteira, não um botão.
  { slug: 'exemplo-login', titulo: 'Tela de acesso', grupo: 'Exemplos', componente: ExemploLoginPage },
  { slug: 'exemplo-dashboard', titulo: 'Painel', grupo: 'Exemplos', componente: ExemploDashboardPage },
  { slug: 'exemplo-crm', titulo: 'Lista de clientes', grupo: 'Exemplos', componente: ExemploCrmPage },
  { slug: 'exemplo-formulario', titulo: 'Cadastro de cliente', grupo: 'Exemplos', componente: ExemploFormularioPage },

  { slug: 'guia-typescript', titulo: 'TypeScript', grupo: 'Guias', componente: GuiaTypeScriptPage },
  { slug: 'guia-formularios', titulo: 'Formulários', grupo: 'Guias', componente: GuiaFormulariosPage },
  { slug: 'guia-testes', titulo: 'Testes', grupo: 'Guias', componente: GuiaTestesPage },
  { slug: 'guia-ssr', titulo: 'Next.js e SSR', grupo: 'Guias', componente: GuiaSSRPage },
  { slug: 'guia-tema', titulo: 'Marca e tema', grupo: 'Guias', componente: GuiaTemaPage },
  { slug: 'guia-icones', titulo: 'Ícones', grupo: 'Guias', componente: GuiaIconesPage },

  // Migração fica num grupo só: quem chega aqui já decidiu adotar e quer saber o custo.
  { slug: 'guia-mui', titulo: 'Vindo do MUI', grupo: 'Migração', componente: GuiaMuiPage },
  { slug: 'guia-tailwind', titulo: 'Vindo do Tailwind', grupo: 'Migração', componente: GuiaTailwindPage },

  { slug: 'button', titulo: 'Button', grupo: 'Ação', componente: ButtonPage },
  { slug: 'menu', titulo: 'Menu', grupo: 'Ação', componente: MenuPage },

  // CampoForm vem primeiro: é ele que amarra label, ajuda e erro ao controle. Quem lê a
  // família na ordem entende por que os outros quatro não repetem essa fiação.
  { slug: 'campoform', titulo: 'CampoForm', grupo: 'Formulário', componente: CampoFormPage },
  { slug: 'campo', titulo: 'Campo', grupo: 'Formulário', componente: CampoPage },
  { slug: 'areatexto', titulo: 'AreaTexto', grupo: 'Formulário', componente: AreaTextoPage },
  { slug: 'selecao', titulo: 'Seleção', grupo: 'Formulário', componente: SelecaoPage },
  { slug: 'caixa', titulo: 'Caixa, Rádio e Interruptor', grupo: 'Formulário', componente: CaixaPage },

  { slug: 'card', titulo: 'Card', grupo: 'Dados', componente: CardPage },
  { slug: 'statcard', titulo: 'StatCard', grupo: 'Dados', componente: StatCardPage },
  { slug: 'tabela', titulo: 'Tabela', grupo: 'Dados', componente: TabelaPage },
  { slug: 'estadovazio', titulo: 'EstadoVazio', grupo: 'Dados', componente: EstadoVazioPage },

  { slug: 'selo', titulo: 'Selo e Etiqueta', grupo: 'Identidade', componente: SeloPage },
  { slug: 'avatar', titulo: 'Avatar', grupo: 'Identidade', componente: AvatarPage },

  { slug: 'alerta', titulo: 'Alerta', grupo: 'Retorno', componente: AlertaPage },
  { slug: 'aviso', titulo: 'Aviso (toast)', grupo: 'Retorno', componente: AvisoPage },
  { slug: 'carregando', titulo: 'Giro, Progresso e Esqueleto', grupo: 'Retorno', componente: CarregandoPage },

  { slug: 'dialogo', titulo: 'Diálogo e Gaveta', grupo: 'Sobreposição', componente: DialogoPage },
  { slug: 'dica', titulo: 'Dica', grupo: 'Sobreposição', componente: DicaPage },

  { slug: 'abas', titulo: 'Abas', grupo: 'Navegação', componente: AbasPage },
  { slug: 'acordeao', titulo: 'Acordeão', grupo: 'Navegação', componente: AcordeaoPage },
  { slug: 'trilha', titulo: 'Trilha', grupo: 'Navegação', componente: TrilhaPage },
  { slug: 'paginacao', titulo: 'Paginação', grupo: 'Navegação', componente: PaginacaoPage },
]
