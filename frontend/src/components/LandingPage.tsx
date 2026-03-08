import { motion } from 'motion/react';
import { ArrowRight, Radio, Cpu, Shield, TrendingUp, Braces } from 'lucide-react';

const FEATURES = [
  {
    icon: Braces,
    title: 'AI Reasoning',
    subtitle: 'Claude-powered causal analysis for risk prediction',
    accent: true,
  },
  {
    icon: Cpu,
    title: 'ML Prediction',
    subtitle: 'XGBoost + SHAP for explainable forecasting',
    accent: false,
  },
  {
    icon: Shield,
    title: 'Auto Intervention',
    subtitle: 'Guardrail-protected autonomous decisions',
    accent: false,
  },
  {
    icon: TrendingUp,
    title: 'Adaptive Learning',
    subtitle: 'Vector memory for continuous improvement',
    accent: true,
  },
];

interface LandingPageProps {
  onEnterDashboard: () => void;
}

export function LandingPage({ onEnterDashboard }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f1419] text-white flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <div className="h-4 w-4 border-2 border-white rounded-sm" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">PHANTOM FLEET</div>
            <div className="text-[10px] font-medium text-white/60 tracking-widest uppercase">
              V3.0 Intelligence
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-8">
          <a href="#analytics" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Analytics
          </a>
          <a href="#map" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
            Fleet Map
          </a>
          <button
            type="button"
            onClick={onEnterDashboard}
            className="px-5 py-2.5 rounded-lg bg-[#ea580c] hover:bg-[#f97316] font-semibold text-sm transition-colors"
          >
            Launch Dashboard
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 pt-32 pb-24 relative">
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
          ))}
        </div>

        <div className="w-full max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ea580c]/50 text-white/90 text-xs font-medium mb-8">
            <Radio size={12} />
            Agentic AI for Logistics
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            <span className="text-white">Autonomous Fleet</span>
            <br />
            <span className="text-[#ea580c]">Intelligence System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time risk prediction, AI-powered causal reasoning, and adaptive learning for mission-critical logistics operations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={onEnterDashboard}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#f97316] hover:to-[#ea580c] font-semibold text-white transition-all shadow-lg shadow-[#ea580c]/20"
            >
              Enter Command Center
              <ArrowRight size={18} />
            </button>
            <a
              href="#map"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold text-white transition-colors"
            >
              View Fleet Map
            </a>
          </motion.div>
        </div>
      </main>

      {/* Feature cards */}
      <section className="px-6 lg:px-12 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:bg-white/[0.06] hover:border-white/15 transition-colors"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 ${feature.accent ? 'bg-[#ea580c]/20 text-[#ea580c]' : 'bg-white/10 text-white/80'}`}
              >
                <feature.icon size={20} strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {feature.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
