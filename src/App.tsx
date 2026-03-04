import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import Layout from "./components/Layout";
import AdvisorPage from "./components/advisor/AdvisorPage";
import WhatsAppManager from "./components/whatsapp/WhatsAppManager";
import StudyGenerator from "./components/reports/StudyGenerator";
import { ThemeProvider } from "./components/theme-provider"; // Importando o ThemeProvider

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
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster position="top-right" richColors />
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
