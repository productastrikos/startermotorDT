// import { useEffect, useRef } from 'react';

// interface HeatmapDataPoint {
//   component: string;
//   metric: string;
//   value: number;
// }

// interface HeatmapChartProps {
//   data: HeatmapDataPoint[];
//   title: string;
//   minValue?: number;
//   maxValue?: number;
// }

// export function HeatmapChart({ data, title, minValue = 0, maxValue = 100 }: HeatmapChartProps) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas || data.length === 0) return;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const dpr = window.devicePixelRatio || 1;
//     const rect = canvas.getBoundingClientRect();

//     canvas.width = rect.width * dpr;
//     canvas.height = rect.height * dpr;
//     ctx.scale(dpr, dpr);

//     const width = rect.width;
//     const chartHeight = rect.height;

//     const components = [...new Set(data.map(d => d.component))];
//     const metrics = [...new Set(data.map(d => d.metric))];

//     const cellWidth = (width - 150) / metrics.length;
//     const cellHeight = (chartHeight - 50) / components.length;

//     ctx.clearRect(0, 0, width, chartHeight);

//     const getColor = (value: number) => {
//       const normalized = (value - minValue) / (maxValue - minValue);
//       if (normalized > 0.8) return '#ef4444';
//       if (normalized > 0.6) return '#f59e0b';
//       if (normalized > 0.4) return '#eab308';
//       if (normalized > 0.2) return '#10b981';
//       return '#22c55e';
//     };

//     components.forEach((component, i) => {
//       ctx.fillStyle = '#d1d5db';
//       ctx.font = '12px sans-serif';
//       ctx.textAlign = 'right';
//       ctx.fillText(component, 140, 30 + i * cellHeight + cellHeight / 2 + 4);
//     });

//     metrics.forEach((metric, j) => {
//       ctx.save();
//       ctx.translate(150 + j * cellWidth + cellWidth / 2, 15);
//       ctx.rotate(-Math.PI / 4);
//       ctx.fillStyle = '#d1d5db';
//       ctx.font = '11px sans-serif';
//       ctx.textAlign = 'right';
//       ctx.fillText(metric, 0, 0);
//       ctx.restore();
//     });

//     data.forEach((point) => {
//       const i = components.indexOf(point.component);
//       const j = metrics.indexOf(point.metric);

//       if (i === -1 || j === -1) return;

//       const x = 150 + j * cellWidth;
//       const y = 30 + i * cellHeight;

//       ctx.fillStyle = getColor(point.value);
//       ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

//       ctx.strokeStyle = '#1f2937';
//       ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

//       ctx.fillStyle = '#ffffff';
//       ctx.font = 'bold 11px sans-serif';
//       ctx.textAlign = 'center';
//       ctx.fillText(point.value.toFixed(0), x + cellWidth / 2, y + cellHeight / 2 + 4);
//     });

//   }, [data, minValue, maxValue]);

//   return (
//     <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
//       <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
//       <canvas
//         ref={canvasRef}
//         style={{ width: '100%', height: '350px' }}
//         className="w-full"
//       />
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";

interface HeatmapDataPoint {
  component: string;
  metric: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  title: string;
  minValue?: number;
  maxValue?: number;
}

export function HeatmapChart({ data, title, minValue = 0, maxValue = 100 }: HeatmapChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [popupData, setPopupData] = useState<HeatmapDataPoint | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      drawChart(rect.width, rect.height, ctx);
    };

    const drawChart = (width: number, height: number, ctx: CanvasRenderingContext2D) => {
      const components = [...new Set(data.map((d) => d.component))];
      const metrics = [...new Set(data.map((d) => d.metric))];

      const cellWidth = (width - 150) / metrics.length;
      const cellHeight = (height - 50) / components.length;

      ctx.clearRect(0, 0, width, height);

      const getColor = (value: number) => {
        const normalized = (value - minValue) / (maxValue - minValue);
        if (normalized > 0.8) return "#ef4444";
        if (normalized > 0.6) return "#f59e0b";
        if (normalized > 0.4) return "#eab308";
        if (normalized > 0.2) return "#10b981";
        return "#22c55e";
      };

      // Draw components (y-axis)
      components.forEach((component, i) => {
        ctx.fillStyle = "#d1d5db";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(component, 140, 30 + i * cellHeight + cellHeight / 2 + 4);
      });

      // Draw metrics (x-axis)
      metrics.forEach((metric, j) => {
        ctx.save();
        ctx.translate(150 + j * cellWidth + cellWidth / 2, 15);
        // ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = "#d1d5db";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(metric, 0, 0);
        ctx.restore();
      });

      // Draw heatmap cells
      data.forEach((point) => {
        const i = components.indexOf(point.component);
        const j = metrics.indexOf(point.metric);
        if (i === -1 || j === -1) return;

        const x = 150 + j * cellWidth;
        const y = 30 + i * cellHeight;

        ctx.fillStyle = getColor(point.value);
        ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

        ctx.strokeStyle = "#1f2937";
        ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(point.value.toFixed(0), x + cellWidth / 2, y + cellHeight / 2 + 4);
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [data, minValue, maxValue]);

  // Tooltip handling
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const components = [...new Set(data.map((d) => d.component))];
    const metrics = [...new Set(data.map((d) => d.metric))];

    const cellWidth = (rect.width - 150) / metrics.length;
    const cellHeight = (rect.height - 50) / components.length;

    for (let point of data) {
      const i = components.indexOf(point.component);
      const j = metrics.indexOf(point.metric);
      const cellX = 150 + j * cellWidth;
      const cellY = 30 + i * cellHeight;
      if (x >= cellX && x <= cellX + cellWidth && y >= cellY && y <= cellY + cellHeight) {
        setTooltip({ x: e.clientX, y: e.clientY, content: `${point.component} / ${point.metric}: ${point.value}` });
        return;
      }
    }
    setTooltip(null);
  };

  const handleClick = () => {
    if (tooltip) {
      const [component, rest] = tooltip.content.split(" / ");
      const [metric, value] = rest.split(": ");
      setPopupData({ component, metric, value: Number(value) });
    }
  };

  return (
    <div className="relative bg-gray-900/50 border border-gray-800 rounded-lg p-5">
      <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "350px", cursor: "pointer" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-10"
          style={{ top: tooltip.y, left: tooltip.x, transform: "translate(100%, 0)" }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Popup Modal */}
      {/* {popupData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold text-white mb-4">Details</h2>
            <p>
              <strong>Component:</strong> {popupData.component}
            </p>
            <p>
              <strong>Metric:</strong> {popupData.metric}
            </p>
            <p>
              <strong>Value:</strong> {popupData.value}
            </p>
            <button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => setPopupData(null)}>
              Close
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
}
