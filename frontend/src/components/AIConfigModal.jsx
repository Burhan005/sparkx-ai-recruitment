import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  Cpu, 
  Zap, 
  Eye, 
  EyeOff,
  RefreshCw
} from 'lucide-react';

export default function AIConfigModal({ isOpen, onClose, onConfigUpdated }) {
  const [aiStatus, setAiStatus] = useState({
    active: false,
    provider: 'Local Semantic Analyzer',
    model: 'Contextual Procedural Synthesizer',
    has_key: false,
    mode: 'simulated'
  });
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    loadStatus();
    setStatusMessage(null);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  async function loadStatus() {
    try {
      const res = await api.getAIStatus();
      if (res) {
        setAiStatus(res);
        if (res.provider && res.provider.toLowerCase().includes('groq')) setSelectedProvider('groq');
        else if (res.provider && res.provider.toLowerCase().includes('openai')) setSelectedProvider('openai');
        else setSelectedProvider('gemini');
      }
    } catch (err) {
      console.warn('Could not fetch AI status:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid API key.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await api.updateAIConfig(selectedProvider, apiKey.trim());
      if (res && res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'API key verified and connected successfully! Real-time Generative AI is now active.'
        });
        setApiKey('');
        await loadStatus();
        if (onConfigUpdated) onConfigUpdated(res.status);
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.message || 'API key verification failed. Please ensure the key has available quota and correct permissions.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to connect: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FDFBF7] dark:bg-[#161311] border border-[#E8E4DF] dark:border-[#2A2520] shadow-2xl p-6 sm:p-7 space-y-5 text-stone-900 dark:text-stone-100 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DF] dark:border-[#2A2520] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-sm text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>Real-Time AI Intelligence Engine</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Connect live LLM models for 100% dynamic, real-time interview synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#24201D] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Engine Status */}
        <div className={`p-4 rounded-2xl border transition-all ${
          aiStatus.active 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300'
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${aiStatus.active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {aiStatus.active ? 'Active LLM Connected' : 'Local Deterministic Engine'}
                </span>
              </div>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {aiStatus.provider} • <span className="font-mono text-xs opacity-90">{aiStatus.model}</span>
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                {aiStatus.active
                  ? 'Every interview question and evaluation response is generated 100% dynamically in real-time.'
                  : 'No active LLM API key detected. Please configure your Google Gemini key below to enable real-time generative AI.'}
              </p>
            </div>
            <button
              onClick={loadStatus}
              title="Refresh status"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Select LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini', desc: '1.5 Flash (Recommended)' },
                { id: 'groq',   label: 'Groq Cloud',    desc: 'Llama 3.3 70B' },
                { id: 'openai', label: 'OpenAI',        desc: 'GPT-4o-mini' },
              ].map(prov => (
                <button
                  type="button"
                  key={prov.id}
                  onClick={() => setSelectedProvider(prov.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedProvider === prov.id
                      ? 'bg-brand-500/10 dark:bg-brand-950/40 border-brand-500 text-stone-950 dark:text-stone-100 ring-1 ring-brand-500/50 shadow-xs'
                      : 'bg-stone-50 dark:bg-[#12100E] border-stone-200 dark:border-[#2A2520] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <span className="text-xs font-bold">{prov.label}</span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">{prov.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>API Key</span>
              </label>
              <a
                href={
                  selectedProvider === 'gemini' 
                    ? 'https://aistudio.google.com/app/apikey' 
                    : selectedProvider === 'groq' 
                    ? 'https://console.groq.com/keys' 
                    : 'https://platform.openai.com/api-keys'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>
                  {selectedProvider === 'gemini' ? 'Get Free Key (Google AI Studio)' : selectedProvider === 'groq' ? 'Get Key (Groq Console)' : 'Get Key (OpenAI)'}
                </span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={`Paste your ${selectedProvider.toUpperCase()} API key...`}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-[#0F0E0D] border border-stone-300 dark:border-[#2A2520] rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-inner font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Saved vs Unsaved Indicator Badge */}
            {apiKey.trim().length > 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Unsaved key in editor — Click "Test & Save Live AI Key" below to verify and save.</span>
              </div>
            ) : aiStatus.has_key ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Saved API key active in backend (.env) — Enter a new key only if you wish to rotate it.</span>
              </div>
            ) : (
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Keys are stored securely in your local environment (`backend/.env`) and never shared externally.
              </p>
            )}
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#24201D] transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test & Save Live AI Key</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
