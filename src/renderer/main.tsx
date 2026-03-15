import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found in DOM')
}

ReactDOM.createRoot(root).render(<App />)
