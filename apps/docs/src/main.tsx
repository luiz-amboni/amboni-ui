import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@amboni/tokens/tokens.css'
// O CSS vem junto: o alias aponta para a FONTE, e cada componente importa o seu .css.
// Quem instala o pacote publicado usa: import '@amboni/ui/styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
