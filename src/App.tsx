import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import Layout from "./components/Layout";
import AdvisorPage from "./components/advisor/AdvisorPage";
import WhatsAppManager from "./components/whatsapp/WhatsAppManager";
import StudyGenerator from "./components/reports/StudyGenerator";

// Configuração do React Query Client
const queryClient = new QueryClient();

// Definição das rotas da aplicação
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <AdvisorPage />,
      },
      {
        path: "/whatsapp",
        element: <WhatsAppManager />,
      },
      {
        // Rota de exemplo para o futuro
        path: "/study",
        element: <StudyGenerator />,
      },
      // Outras páginas podem ser adicionadas aqui
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* O ThemeProvider do shadcn aplicaria o tema aqui, mas estamos definindo no CSS */}
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
