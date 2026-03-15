import ReactDOM from 'react-dom/client'
import './styles.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found in DOM')
}

ReactDOM.createRoot(root).render(<h1 className="text-2xl font-bold p-4">DeskFlow</h1>)
