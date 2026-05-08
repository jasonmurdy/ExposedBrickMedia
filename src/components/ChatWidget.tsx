import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { useSiteContent } from '../lib/SiteContentContext';

interface Message {
  id: string;
  prompt: string;
  response?: string;
  createTime: any;
}

export const ChatWidget = () => {
  const { settings } = useSiteContent();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settings.chatbotEnabled) return;

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        signInAnonymously(auth).catch(err => {
          if (err.code === 'auth/admin-restricted-operation') {
            console.warn("Anonymous auth is disabled in Firebase Console. Please enable it to use the chatbot.");
          } else {
            console.error("Anon auth failed:", err);
          }
        });
      }
    });
    return () => unsub();
  }, [settings.chatbotEnabled]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'users', user.uid, 'chats'),
      orderBy('createTime', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });

    return () => unsub();
  }, [user, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || loading) return;

    const userQuery = input.trim();
    setInput('');
    setLoading(true);

    try {
      const isFirstMessage = messages.length === 0;
      let finalPrompt = userQuery;

      if (isFirstMessage && settings.chatbotPricing) {
        const pricing = settings.chatbotPricing;
        finalPrompt = `[SYSTEM NOTE: Current Base Price: $${pricing.flambient_base}, Drone: $${pricing.drone_addon}, Turnaround: ${pricing.turnaround_time}.] USER: ${userQuery}`;
      }

      // 1. Add user message to Firestore
      const chatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
        prompt: finalPrompt,
        displayPrompt: userQuery, // Keep original for UI
        createTime: serverTimestamp(),
      });

      // 2. Generate response using backend proxy
      const history = messages.map(m => ([
        { role: 'user', parts: [{ text: m.prompt }] },
        { role: 'model', parts: [{ text: m.response || '' }] }
      ])).flat().filter(p => p.parts[0].text !== '');

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          history: history,
          systemInstruction: settings.chatbotPersona || "You are a helpful assistant for Exposed Brick Media, a high-end real estate photography and cinematography agency."
        })
      });

      if (!response.ok) throw new Error('AI chat failed');
      const data = await response.json();
      const responseText = data.text || "I'm sorry, I couldn't process that.";

      // 3. Update the document with the response
      await setDoc(chatRef, { response: responseText }, { merge: true });

    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!settings.chatbotEnabled) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-24 right-0 w-[350px] md:w-[400px] h-[550px] bg-charcoal border border-brick-copper/50 shadow-[0_0_50px_-12px_rgba(180,95,66,0.3)] flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-brick-copper p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-charcoal flex items-center justify-center text-brick-copper shadow-inner">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-charcoal font-black text-[11px] uppercase tracking-widest leading-none mb-1">Architecture AI</h3>
                  <p className="text-charcoal/80 text-[8px] uppercase tracking-tighter font-bold">Exposed Brick Assistant</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-charcoal/60 hover:text-charcoal transition-all p-1 hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-7 no-scrollbar bg-charcoal/30"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6 text-brick-copper/30">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 leading-relaxed font-light italic">
                    Establish a dialogue with our <br/> <span className="text-brick-copper font-bold not-italic">Creative Intelligence</span>
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <React.Fragment key={m.id}>
                  {/* User Message */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-white/10 border border-white/20 p-4 max-w-[85%] rounded-sm shadow-sm">
                      <p className="text-[12px] text-white leading-relaxed font-medium">
                        {(m as any).displayPrompt || m.prompt.split('USER: ').pop()}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  {m.response && (
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={12} className="text-brick-copper" />
                        <span className="text-[9px] uppercase tracking-widest text-white/50 font-black">Design Intelligence</span>
                      </div>
                      <div className="bg-brick-copper/20 border border-brick-copper/30 p-4 max-w-[85%] rounded-sm shadow-md">
                        <p className="text-[12px] text-white/95 leading-relaxed font-sans whitespace-pre-wrap">
                          {m.response}
                        </p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-brick-copper/60">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[9px] uppercase tracking-[0.3em] font-black animate-pulse">Calculating...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSend}
              className="p-5 border-t border-white/10 bg-charcoal/80"
            >
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Inquire about our process..."
                  className="w-full bg-white/5 border border-white/15 outline-none py-4 pl-5 pr-14 text-[12px] text-white placeholder:text-white/30 focus:border-brick-copper/80 transition-all font-sans rounded-none"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-brick-copper hover:text-white transition-all disabled:opacity-10"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(180,95,66,0.5)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 border border-brick-copper/40 relative overflow-hidden group ${isOpen ? 'bg-charcoal text-brick-copper' : 'bg-brick-copper text-charcoal'}`}
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        {isOpen ? <X size={28} className="relative z-10" /> : <MessageSquare size={28} className="relative z-10" />}
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-charcoal"
          >
            <Sparkles size={10} className="text-brick-copper" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};
