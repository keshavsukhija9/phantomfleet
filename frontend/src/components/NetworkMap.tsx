import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import type { Shipment } from '../types';
import { useMemo } from 'react';

const Plot = createPlotlyComponent(Plotly);

interface NetworkMapProps {
  shipments: Record<string, Shipment>;
  onHighlight: (id: string | null) => void;
}

// Map Indian cities to coordinates for the visualization
const LOCATIONS: Record<string, { lat: number; lon: number }> = {
  W1: { lat: 19.0760, lon: 72.8777 }, // Mumbai
  W2: { lat: 28.7041, lon: 77.1025 }, // Delhi
  W3: { lat: 13.0827, lon: 80.2707 }, // Chennai
  D1: { lat: 12.9716, lon: 77.5946 }, // Bangalore
  D2: { lat: 17.3850, lon: 78.4867 }, // Hyderabad
  D3: { lat: 22.5726, lon: 88.3639 }, // Kolkata
};

export function NetworkMap({ shipments, onHighlight }: NetworkMapProps) {
  const plotData = useMemo(() => {
    const data: any[] = [];

    // Rescued lines
    const rescued = Object.values(shipments).filter(s => s.status === 'RESCUED');
    rescued.forEach(s => {
      const origin = LOCATIONS[s.origin] || LOCATIONS['W1'];
      const dest = LOCATIONS[s.destination] || LOCATIONS['D1'];
      data.push({
        type: 'scattermapbox',
        mode: 'lines',
        lat: [origin.lat, dest.lat],
        lon: [origin.lon, dest.lon],
        line: { width: 2, color: 'rgba(234, 88, 12, 0.8)' },
        hoverinfo: 'none',
        showlegend: false,
      });
    });

    // At-Risk shipments
    const atRisk = Object.values(shipments).filter(s => s.status === 'AT_RISK' || s.status === 'FAILED');
    if (atRisk.length > 0) {
      data.push({
        type: 'scattermapbox',
        mode: 'markers+text',
        lat: atRisk.map(s => (LOCATIONS[s.origin] || LOCATIONS['W1']).lat),
        lon: atRisk.map(s => (LOCATIONS[s.origin] || LOCATIONS['W1']).lon),
        text: atRisk.map(s => s.id),
        textposition: 'top center',
        textfont: { family: 'Inter', size: 10, color: '#fff' },
        marker: {
          symbol: 'circle',
          size: atRisk.map(s => Math.max(8, (s.failure_prob || 0.5) * 20)),
          color: atRisk.map(s => s.status === 'FAILED' ? '#ef4444' : '#f97316'),
          opacity: 0.95,
        },
        hoverinfo: 'text',
        hovertext: atRisk.map(s => `${s.id} - Prob: ${((s.failure_prob || 0) * 100).toFixed(1)}%`),
        name: 'At Risk',
        showlegend: false,
      });
    }

    // Nodes (Warehouses/Destinations)
    const nodeLats = Object.values(LOCATIONS).map(l => l.lat);
    const nodeLons = Object.values(LOCATIONS).map(l => l.lon);
    data.push({
      type: 'scattermapbox',
      mode: 'markers+text',
      lat: nodeLats,
      lon: nodeLons,
      text: Object.keys(LOCATIONS),
      textposition: 'bottom right',
      textfont: { family: 'Inter', size: 10, color: 'rgba(255,255,255,0.8)' },
      marker: {
        symbol: 'square',
        size: 8,
        color: '#ea580c',
      },
      hoverinfo: 'none',
      showlegend: false,
    });

    return data;
  }, [shipments]);

  return (
    <div className="w-full h-full min-h-[400px] rounded-b-lg overflow-hidden">
      <Plot
        data={plotData}
        layout={{
          mapbox: {
            style: 'carto-darkmatter',
            center: { lat: 21.0, lon: 78.0 },
            zoom: 3.5,
          },
          margin: { l: 0, r: 0, b: 0, t: 0 },
          paper_bgcolor: '#161d26',
          plot_bgcolor: '#161d26',
          showlegend: false,
          dragmode: false,
        }}
        config={{
          displayModeBar: false,
          scrollZoom: false,
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        onHover={(e) => {
          if (e.points && e.points[0].text) {
            onHighlight(e.points[0].text as string);
          }
        }}
        onUnhover={() => onHighlight(null)}
      />
    </div>
  );
}
