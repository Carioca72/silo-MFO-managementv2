import { useEffect, useState } from 'react';
import { Search, Database } from 'lucide-react';
import { WebhookSimulator } from './crm/WebhookSimulator';

interface Tool {
  url: string;
  description: string;
  params: string[];
}

export function ToolsCatalog() {
  const [tools, setTools] = useState<Record<string, Tool>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        setTools(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load tools", err);
        setLoading(false);
      });
  }, []);

  const filteredTools = (Object.entries(tools) as [string, Tool][]).filter(([key, tool]) => 
    key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Simulator Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#1A1A2E] mb-4">Ferramentas de Teste</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WebhookSimulator />
        </div>
      </div>

      {/* Existing Tools Catalog */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2 mb-4">
            <Database className="text-[#C9A84C]" />
            Catálogo de Ferramentas ComDinheiro
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando catálogo...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map(([key, tool]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-[#C9A84C] transition-colors bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-mono font-bold text-[#1A1A2E] text-sm bg-white px-2 py-1 rounded border border-gray-200">
                      {key}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">API</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">Parâmetros:</span> {tool.params.slice(0, 3).join(', ')}
                    {tool.params.length > 3 && ` +${tool.params.length - 3} outros`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
