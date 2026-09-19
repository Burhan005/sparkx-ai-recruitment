import React, { useState, useEffect } from 'react';
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
    if (isOpen) {
      loadStatus();
      setStatusMessage(null);
    }
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0F19] border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Real-Time AI Intelligence Engine</span>
              </h3>
              <p className="text-xs text-slate-400">
                Connect live LLM models for 100% dynamic, real-time interview synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Engine Status */}
        <div className={`p-4 rounded-2xl border transition-all ${
          aiStatus.active 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/25 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${aiStatus.active ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {aiStatus.active ? 'Active LLM Connected' : 'Simulated Procedural Mode'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {aiStatus.provider} • <span className="font-mono text-xs opacity-90">{aiStatus.model}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {aiStatus.active
                  ? 'Every interview question and evaluation response is generated 100% dynamically in real-time.'
                  : 'No active LLM API key detected. Please configure your Google Gemini key below to enable real-time generative AI.'}
              </p>
            </div>
            <button
              onClick={loadStatus}
              title="Refresh status"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Select LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gemini', label: 'Google Gemini', desc: '1.5 Flash (Free Tier)' },
                { id: 'groq',   label: 'Groq',          desc: 'Llama 3.3 70B' },
                { id: 'openai', label: 'OpenAI',        desc: 'GPT-4o-mini' },
              ].map(prov => (
                <button
                  type="button"
                  key={prov.id}
                  onClick={() => setSelectedProvider(prov.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedProvider === prov.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                      : 'bg-[#06080E] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{prov.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{prov.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>API Key</span>
              </label>
              {selectedProvider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <span>Get Free Key (Google AI Studio)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={`Paste your ${selectedProvider.toUpperCase()} API key...`}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#06080E] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Keys are stored securely in your local environment (`backend/.env`) and never transmitted to external third parties.
            </p>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !apiKey.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 disabled:opacity-40 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
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
    </div>
  );
}
