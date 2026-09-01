import { API_BASE_URL } from '@/config';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { Button } from './ui/Button';

export default function CopilotDrawer({ context }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const chips = [
    `Why is this target classified as ${context?.status || 'its current status'}?`,
    "What policy interventions can close the gap by 2030?",
    "Summarize the 2015-2030 trajectory in 2 sentences."
  ];

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
      // Create a context snapshot limited to the latest 5 records to save tokens
      const recentData = context?.historicalData 
        ? context.historicalData.slice(-5) 
        : [];

      const systemPrompt = `You are an expert UN SDG Senior Policy Advisor. Ground your answers strictly on the provided country statistical context. Provide concise, actionable bullet points. 
Context: 
Country: ${context?.countryName} (${context?.countryCode})
Target: ${context?.selectedTarget}
Baseline Value: ${context?.baselineValue}
Projected 2030 Value: ${context?.projectedValue2030}
Status: ${context?.status}
Recent Data Trends: ${JSON.stringify(recentData)}`;

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
      const reply = data.content;

      // Simple markdown-to-html conversion for bold and newlines
      const formattedReply = reply
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');

      setMessages(prev => [...prev, { role: 'assistant', content: formattedReply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `🚨 Error connecting to the AI service. (${error.message})` 
      }]);
    } finally {
      setIsLoading(false);
    }
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
              <span className="font-semibold tracking-wide">Ask SDG Copilot</span>
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
                  <h3 className="font-serif font-bold leading-tight">SDG Policy Copilot</h3>
                  <p className="text-xs text-indigo-200 opacity-80">Powered by AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
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
                      dangerouslySetInnerHTML={{ __html: msg.content }}
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
