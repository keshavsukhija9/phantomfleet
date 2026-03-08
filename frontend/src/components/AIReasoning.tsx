import { useEffect, useState } from 'react';
import type { AgentState } from '../types';

interface AIReasoningProps {
  causalMap: AgentState['causal_map'];
  shapMap?: AgentState['shap_map'];
  activeAtRisk: string[];
}

const Typewriter = ({ text, speed = 18 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <div className="relative font-['DM_Sans'] text-[14px] leading-[1.7] text-[var(--text-primary)]">
      {displayedText}
      {isTyping && <span className="animate-pulse inline-block w-[6px] h-[14px] bg-[var(--accent-primary)] ml-1 translate-y-[2px]" />}
    </div>
  );
};

export function AIReasoning({ causalMap, shapMap = {}, activeAtRisk }: AIReasoningProps) {
  // Top 3 at-risk shipments with causal data
  const entries = activeAtRisk
    .filter(sid => causalMap[sid])
    .slice(0, 3)
    .map(sid => ({
      id: sid,
      causeData: causalMap[sid],
      shapData: shapMap[sid] as any
    }));

  const getCauseColor = (cause: string) => {
    if (cause.includes('CRITICAL') || cause.includes('FAILED')) return 'var(--accent-danger)';
    if (cause.includes('DEGRADATION') || cause.includes('PRESSURE') || cause.includes('RISK')) return 'var(--accent-warning)';
    return 'var(--text-muted)';
  };

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center font-['IBM_Plex_Mono'] text-2xl tracking-widest text-[var(--text-muted)] uppercase">
        ALL SHIPMENTS NOMINAL
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12">
      <div className="border-b border-[var(--bg-border)] pb-2 mb-2">
        <h1 className="font-['IBM_Plex_Mono'] text-lg font-bold tracking-wider text-[var(--text-primary)] uppercase">Agent Reasoning</h1>
        <p className="text-[11px] text-[var(--text-secondary)] font-['DM_Sans']">Live causal hypotheses for top {entries.length} at-risk shipments</p>
      </div>

      {entries.map(({ id, causeData, shapData }) => {
        const primaryCause = causeData.primary_cause || 'UNKNOWN_ANOMALY';
        const causeColor = getCauseColor(primaryCause);
        const confidence = causeData.confidence ?? 0;
        const confColor = confidence > 0.8 ? 'var(--accent-success)' : confidence > 0.5 ? 'var(--accent-warning)' : 'var(--accent-danger)';

        // Handle SHAP top 3 features if available
        let shapFeatures: { name: string; value: number; shap: number }[] = [];
        if (shapData && shapData.expected_value !== undefined && Array.isArray(shapData.features) && Array.isArray(shapData.shap_values)) {
          shapFeatures = shapData.features.map((feat: string, i: number) => ({
            name: feat,
            value: shapData.feature_values?.[i] || 0,
            shap: shapData.shap_values[i] || 0
          }))
            .sort((a: any, b: any) => Math.abs(b.shap) - Math.abs(a.shap))
            .slice(0, 3);
        }

        const maxShapAbs = Math.max(...shapFeatures.map(f => Math.abs(f.shap)), 0.1);

        return (
          <div key={id} className="bg-[var(--bg-surface)] border border-[var(--bg-border)] flex flex-col hover:border-[var(--text-muted)] transition-colors">

            {/* Header */}
            <div className="p-4 border-b border-[var(--bg-border)] flex justify-between items-center bg-[var(--bg-base)]">
              <div className="flex items-center gap-4">
                <span className="font-['IBM_Plex_Mono'] text-xl font-bold tracking-wider text-[var(--accent-primary)]">{id}</span>
                <span className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-wider px-2 py-0.5" style={{ backgroundColor: `rgba(255,176,32,0.1)`, color: causeColor, border: `1px solid ${causeColor}` }}>
                  {primaryCause.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Confidence Meter */}
              <div className="flex items-center gap-3 w-48">
                <span className="font-['IBM_Plex_Mono'] text-[10px] tracking-wider text-[var(--text-secondary)]">
                  CONFIDENCE {(confidence * 100).toFixed(0)}%
                </span>
                <div className="flex-1 h-1 bg-[var(--bg-elevated)]">
                  <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${confidence * 100}%`, backgroundColor: confColor }} />
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col gap-6">

              {/* Hypothesis typing effect */}
              <div className="pl-4 border-l-2 border-[var(--accent-primary)] bg-gradient-to-r from-[var(--accent-primary-dim)] to-transparent p-4">
                <Typewriter text={causeData.hypothesis || "No causal text generated."} />
              </div>

              {/* SHAP Breakdown */}
              {shapFeatures.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <h4 className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">SHAP Feature Attribution</h4>
                  {shapFeatures.map(feat => {
                    const isPositive = feat.shap > 0;
                    const barColor = isPositive ? 'var(--accent-danger)' : 'var(--accent-success)';
                    const barWidth = `${(Math.abs(feat.shap) / maxShapAbs) * 100}%`;

                    return (
                      <div key={feat.name} className="flex items-center text-xs font-['JetBrains_Mono']">
                        <div className="w-40 truncate text-[var(--text-secondary)]" title={feat.name}>
                          {feat.name.replace(/_/g, ' ')}
                        </div>
                        <div className="w-16 text-right mr-4 text-[var(--text-primary)]">
                          {feat.value.toFixed(2)}
                        </div>

                        {/* Bi-directional SHAP Bar representation */}
                        <div className="flex-1 flex items-center h-4 relative">
                          {/* Zero line */}
                          <div className="absolute left-[50%] w-px h-full bg-[var(--bg-border)] z-10" />

                          {/* Negative side (left) */}
                          <div className="flex-1 flex justify-end h-full">
                            {!isPositive && (
                              <div className="h-1.5 self-center" style={{ width: barWidth, backgroundColor: barColor }} />
                            )}
                          </div>

                          {/* Positive side (right) */}
                          <div className="flex-1 flex justify-start h-full">
                            {isPositive && (
                              <div className="h-1.5 self-center" style={{ width: barWidth, backgroundColor: barColor }} />
                            )}
                          </div>
                        </div>

                        <div className="w-16 text-right font-bold ml-2" style={{ color: barColor }}>
                          {feat.shap > 0 ? '+' : ''}{feat.shap.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}
