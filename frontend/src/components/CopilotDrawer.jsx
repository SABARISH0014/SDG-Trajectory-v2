import { API_BASE_URL } from '@/config';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Bot, User, RotateCcw, HelpCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from './ui/Button';

export default function CopilotDrawer({ context }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Dynamic status-aware starter chips
  const chips = useMemo(() => {
    const country = context?.countryName || 'the nation';
    const target = context?.selectedTarget || 'this indicator';
    const status = context?.status || 'Unknown';
    const unit = context?.unit || '';

    if (status === 'On-track' || status === 'Achieved') {
      return [
        `How can ${country} sustain this positive progress beyond 2030?`,
        `What external economic risks could derail this trajectory?`,
        `Draft a 3-bullet executive brief celebrating this milestone.`
      ];
    } else if (status === 'At-risk' || status === 'Lagging' || status === 'Off-track') {
      return [
        `What policy interventions can close the ${unit ? `gap (${unit})` : 'gap'} by 2030?`,
        `Why is ${country} lagging behind the UN 2030 benchmark?`,
        `Suggest 3 high-impact, cost-effective budget priorities for Target ${target}.`
      ];
    }

    return [
      `Why is this target classified as ${status}?`,
      `What policy interventions can close the gap by 2030?`,
      `Summarize the 2015-2030 trajectory in 2 sentences.`
    ];
  }, [context?.status, context?.countryName, context?.selectedTarget, context?.unit]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const newUserMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 1. Separate actual historical records (years with real observations) from future projections
      const chartRows = Array.isArray(context?.historicalData) ? context.historicalData : [];
      const actualHistorical = chartRows
        .filter(d => d.actualValue !== null && d.actualValue !== undefined)
        .slice(-5)
        .map(d => ({ Year: d.Year, Value: d.actualValue }));

      const projectedFuture = chartRows
        .filter(d => d.predictedValue !== null && d.predictedValue !== undefined && d.Year >= 2025)
        .map(d => ({ Year: d.Year, Projected: d.predictedValue }));

      const systemPrompt = `You are an expert UN SDG Senior Policy Advisor. Ground your answers strictly on the provided country statistical context. Provide concise, structured, actionable bullet points. Avoid filler text.

Statistical Context:
- Country: ${context?.countryName || 'Unknown'} (${context?.countryCode || 'N/A'})
- Target: ${context?.selectedTarget || 'N/A'} ${context?.targetName ? `- ${context.targetName}` : ''}
- Unit: ${context?.unit || 'Index/Rate'}
- Polarity: ${context?.polarity === 'lower_is_better' ? 'Lower value is better (reduction desired)' : 'Higher value is better (increase desired)'}
- Baseline Value (2015): ${context?.baselineValue ?? 'N/A'}
- Projected 2030 Value: ${context?.projectedValue2030 ?? 'N/A'}
- UN Official 2030 Benchmark: ${context?.benchmarkValue !== null && context?.benchmarkValue !== undefined ? `${context.benchmarkValue} (${context?.benchmarkLabel || 'Target'})` : 'No rigid quantitative cap'}
- Trajectory Status: ${context?.status || 'Unknown'}
- Recent Historical Actuals: ${JSON.stringify(actualHistorical)}
- 2025-2030 Projections: ${JSON.stringify(projectedFuture)}`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
        newUserMsg
      ];

      const response = await fetch(`${API_BASE_URL}/api/copilot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: apiMessages
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Request Failed: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content || '';

      // Markdown-to-html conversion for bold, italics, bullets and line breaks
      const rawHtml = reply
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\s*[-*]\s+(.*)$/gm, '• $1')
        .replace(/\n/g, '<br/>');

      const sanitizedReply = DOMPurify.sanitize(rawHtml);

      setMessages(prev => [...prev, { role: 'assistant', content: sanitizedReply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `🚨 Error connecting to the AI service. (${DOMPurify.sanitize(error.message)})` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button 
              onClick={() => setIsOpen(true)}
              className="rounded-full shadow-lg h-14 px-6 bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-indigo-400/30 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="notranslate font-semibold tracking-wide">Ask SDG Copilot</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-navy p-4 flex items-center justify-between text-white shadow-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/30 p-2 rounded-xl">
                  <Bot className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h3 className="notranslate font-serif font-bold leading-tight flex items-center gap-2">
                    <span>SDG Policy Copilot</span>
                    {context?.countryCode && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/40 text-indigo-100">
                        {context.countryCode}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-indigo-200 opacity-80 truncate max-w-[200px]">
                    Target {context?.selectedTarget || 'Indicator Advisory'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button 
                    onClick={handleClearChat}
                    title="Reset Conversation"
                    className="text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="bg-indigo-100 p-4 rounded-full">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-center space-y-2 px-2">
                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                      I'm your AI Policy Advisor. I analyze the active trajectory for <strong className="text-slate-700">{context?.countryName || 'this country'}</strong> on Target <strong className="text-slate-700">{context?.selectedTarget}</strong>.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full mt-4">
                    {chips.map((chip, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-left text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 p-3 rounded-xl transition-all shadow-sm focus:outline-none"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-navy text-white'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div 
                      className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                      }`}
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                    />
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 rounded-tl-sm flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-500 font-medium">Analyzing data...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                className="flex items-center gap-2 relative"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a policy question..."
                  className="flex-1 bg-slate-100 border-none rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors focus:outline-none"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
