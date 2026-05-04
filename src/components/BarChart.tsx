import { useEffect, useRef, useState } from "react";

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  title: string;
  yAxisLabel?: string;
  height?: number;
  horizontal?: boolean;
}

interface BarTooltipData {
  x: number;
  y: number;
  dataPoint: BarDataPoint;
}
// function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
//   const words = text.split(" ");
//   let line = "";
//   let lineCount = 0;

//   for (let n = 0; n < words.length; n++) {
//     const testLine = line + (line ? " " : "") + words[n];
//     const metrics = ctx.measureText(testLine);
//     if (metrics.width > maxWidth && n > 0) {
//       ctx.fillText(line, x, y + lineCount * lineHeight);
//       line = words[n];
//       lineCount++;
//     } else {
//       line = testLine;
//     }
//   }
//   ctx.fillText(line, x, y + lineCount * lineHeight);
// }
function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? " " : "") + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[n];
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + lineCount * lineHeight);
}

export function BarChart({ data, title, yAxisLabel, height = 290, horizontal = false }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<BarTooltipData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;
    const padding = horizontal ? { top: 20, right: 40, bottom: 30, left: 150 } : { top: 20, right: 20, bottom: 80, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, chartHeight);

    const maxValue = Math.max(...data.map((d) => d.value));
    const yMax = maxValue * 1.1;

    if (horizontal) {
      const barHeight = plotHeight / data.length;
      const barPadding = barHeight * 0.2;
      const actualBarHeight = barHeight - barPadding;

      data.forEach((item, index) => {
        const barWidth = (item.value / yMax) * chartWidth;
        const y = padding.top + index * barHeight;
        const x = padding.left;

        ctx.fillStyle = item.color || "#10b981";
        ctx.fillRect(x, y, barWidth, actualBarHeight);

        ctx.fillStyle = "#d1d5db";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(item.label, padding.left - 10, y + actualBarHeight / 2 + 4);

        ctx.textAlign = "left";
        ctx.fillText(item.value.toFixed(1), x + barWidth + 5, y + actualBarHeight / 2 + 4);
      });
    } else {
      const barWidth = chartWidth / data.length;
      const barPadding = barWidth * 0.2;
      const actualBarWidth = barWidth - barPadding;

      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (plotHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const value = yMax - yMax * (i / 5);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
      }

      data.forEach((item, index) => {
        const barHeight = (item.value / yMax) * plotHeight;
        const x = padding.left + index * barWidth + barPadding / 2;
        const y = padding.top + plotHeight - barHeight;

        ctx.fillStyle = item.color || "#10b981";
        ctx.fillRect(x, y, actualBarWidth, barHeight);

        // ctx.save();
        // // ctx.translate(x + actualBarWidth / 2, chartHeight - padding.bottom + 20);
        // // ctx.rotate(-Math.PI / 4);
        // ctx.fillStyle = "#d1d5db";
        // ctx.font = "11px sans-serif";
        // ctx.textAlign = "center";
        // ctx.fillText(item.label, 0, 0);
        // ctx.restore();
        ctx.fillStyle = "#d1d5db";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";

        // Set max width and line height
        const maxWidth = actualBarWidth;
        const lineHeight = 12;

        // Move starting y-position below the x-axis
        const startY = chartHeight - padding.bottom + lineHeight;

        drawWrappedText(ctx, item.label, x + actualBarWidth / 2, startY, maxWidth, lineHeight);

        ctx.fillStyle = "#d1d5db";
        ctx.fillText(item.value.toFixed(1), x + actualBarWidth / 2, y - 5);

        ctx.fillStyle = "#d1d5db";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(item.value.toFixed(1), x + actualBarWidth / 2, y - 5);
      });
    }

    if (yAxisLabel && !horizontal) {
      ctx.save();
      ctx.translate(15, chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#d1d5db";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }
  }, [data, yAxisLabel, height, horizontal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const padding = horizontal ? { top: 20, right: 40, bottom: 20, left: 150 } : { top: 20, right: 20, bottom: 80, left: 60 };

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (horizontal) {
      const plotHeight = rect.height - padding.top - padding.bottom;
      const barHeight = plotHeight / data.length;
      const index = Math.floor((mouseY - padding.top) / barHeight);

      if (index >= 0 && index < data.length) {
        setTooltip({
          x: mouseX,
          y: mouseY,
          dataPoint: data[index],
        });
      } else {
        setTooltip(null);
      }
    } else {
      const chartWidth = rect.width - padding.left - padding.right;
      const barWidth = chartWidth / data.length;
      const index = Math.floor((mouseX - padding.left) / barWidth);

      if (index >= 0 && index < data.length) {
        setTooltip({
          x: mouseX,
          y: mouseY,
          dataPoint: data[index],
        });
      } else {
        setTooltip(null);
      }
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 relative">
      <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: `${height}px` }}
          className="w-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 40}px`,
              transform: tooltip.x > 200 ? "translateX(-100%) translateX(-20px)" : "none",
            }}
          >
            <div className="text-gray-300">
              <div className="font-semibold">{tooltip.dataPoint.label}</div>
              <div className="text-green-400">{tooltip.dataPoint.value.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
