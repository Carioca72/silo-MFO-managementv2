import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, FileText, RefreshCw, StopCircle } from 'lucide-react';
import { getApiUrl } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --- Interfaces e Constantes ---
type MessageRole = 'user' | 'assistant';
interface Message {
  role: MessageRole;
  content: string;
  ts: string;
}

const QUICK_PROMPTS = [
  'Analise o risco da carteira Familia Andrade',
  'Recomende ferramentas para relatorio mensal',
  'Calcule VaR 95% para Holding Cerqueira',
  'Gere estudo de viabilidade — perfil moderado R$10M',
  'Compare retorno das carteiras vs CDI ultimo ano',
];

// --- Componentes de UI ---

// Renderizador de Markdown simples, adaptado para o novo tema
const MarkdownRenderer = ({ text }: { text: string }) => {
  const html = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm font-mono text-xs">$1</code>')
    .replace(/^#{2}\s(.+)/gm, '<h2 class="text-lg font-semibold text-foreground mt-2 mb-1">$1</h2>')
    .replace(/^-\s(.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose prose-sm dark:prose-invert max-w-none" />;
};

const ChatMessage = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
        </Avatar>
      )}
      <div 
        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${isUser 
          ? 'bg-primary text-primary-foreground rounded-br-none' 
          : 'bg-secondary text-secondary-foreground rounded-bl-none'}`
        }>
        <MarkdownRenderer text={msg.content} />
        <p className={`text-xs mt-2 ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{msg.ts}</p>
      </div>
      {isUser && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

const QuickPromptPanel = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <Sparkles className="text-primary" size={18} /> Consultas Rápidas
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {QUICK_PROMPTS.map((prompt, i) => (
        <Button key={i} variant="outline" size="sm" className="text-xs text-left justify-start h-auto whitespace-normal" onClick={() => onPromptClick(prompt)}>
          {prompt}
        </Button>
      ))}
    </CardContent>
  </Card>
);

const SessionInfoPanel = ({ messageCount }: { messageCount: number }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <FileText className="text-primary" size={18} /> Sessão Atual
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground space-y-2">
      <div className="flex justify-between"><span>Modelo</span> <span className="font-medium text-foreground">Gemini 2.5 Flash</span></div>
      <div className="flex justify-between"><span>Mensagens</span> <span className="font-medium text-foreground">{messageCount}</span></div>
      <div className="flex justify-between"><span>Status API</span> <span className="font-medium text-green-500">Online</span></div>
    </CardContent>
  </Card>
);

// --- Componente Principal ---

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '## SILO Advisor\nOlá! Como posso te ajudar a analisar seus portfólios hoje?', ts: new Date().toLocaleTimeString('pt-BR') }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSendMessage = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim() || isLoading) return;

    setInput('');
    const userMessage: Message = { role: 'user', content: messageToSend, ts: new Date().toLocaleTimeString('pt-BR') };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);
    setStreamingContent('');
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(getApiUrl('/advisor/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          history: newHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Resposta da API inválida.');
      }

      // Processamento de Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullReply += decoder.decode(value, { stream: true });
        setStreamingContent(fullReply);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: fullReply, ts: new Date().toLocaleTimeString('pt-BR') }]);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Ocorreu um erro ao conectar com o servidor. Por favor, tente novamente.',
          ts: new Date().toLocaleTimeString('pt-BR'),
        }]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleClearChat = () => {
    abortControllerRef.current?.abort();
    setMessages([
      { role: 'assistant', content: 'Conversa reiniciada. Como posso ajudar?', ts: new Date().toLocaleTimeString('pt-BR') }
    ]);
    setStreamingContent('');
    setIsLoading(false);
  };
  
  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      
      {/* Coluna Principal do Chat */}
      <div className="md:col-span-2 flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-lg">SILO Advisor</CardTitle>
                    <p className="text-sm text-muted-foreground">Análise de Portfólio e Risco</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClearChat} title="Limpar conversa">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            
            {streamingContent && (
                <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[80%] rounded-lg bg-secondary text-secondary-foreground px-4 py-3 text-sm rounded-bl-none">
                        <MarkdownRenderer text={streamingContent} />
                        <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse rounded-sm"/>
                    </div>
                </div>
            )}

            {isLoading && !streamingContent && (
                <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-3 rounded-lg">
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analisando...</span>
                    </div>
                </div>
            )}
            <div ref={endOfMessagesRef} />
          </CardContent>

          <CardFooter className="p-4 border-t">
            <div className="flex items-start gap-2 w-full">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Converse com seu Advisor... (Enter para enviar, Shift+Enter para nova linha)"
                className="flex-1 resize-none" 
                rows={1}
              />
              {isLoading ? (
                <Button variant="destructive" size="icon" onClick={handleStopGeneration} title="Parar geração">
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button size="icon" onClick={() => handleSendMessage()} disabled={!input.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Coluna Lateral */}
      <div className="hidden md:flex flex-col gap-6">
        <QuickPromptPanel onPromptClick={handleSendMessage} />
        <SessionInfoPanel messageCount={messages.length} />
      </div>
    </div>
  );
}
