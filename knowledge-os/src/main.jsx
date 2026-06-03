import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/components.css';
import './styles/app.css';
import { DocsProvider } from './store.jsx';
import { WorkflowsProvider } from './workflow.jsx';
import { PluginsProvider } from './plugins.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DocsProvider>
      <WorkflowsProvider>
        <PluginsProvider>
          <App />
        </PluginsProvider>
      </WorkflowsProvider>
    </DocsProvider>
  </StrictMode>,
);
