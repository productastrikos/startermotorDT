import { useEffect, useRef, useState } from "react";

interface DataPoint {
  x: number | string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  height?: number;
}

interface TooltipData {
  x: number;
  y: number;
  dataPoint: DataPoint;
}

export function LineChart({ data, title, color = "#10b981", yAxisLabel, xAxisLabel, height = 250 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

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
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, chartHeight);

    const yValues = data.map((d) => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY || 1;
    const yPadding = yRange * 0.1;

    const yMin = minY - yPadding;
    const yMax = maxY + yPadding;

    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => padding.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = yMax - (yMax - yMin) * (i / 5);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    // Draw filled area under line
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.y);
      if (index === 0) ctx.moveTo(x, y);
      else {
        const prevX = getX(index - 1);
        const prevY = getY(data[index - 1].y);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    const lineEndX = getX(data.length - 1);
    const lineStartX = getX(0);
    ctx.lineTo(lineEndX, padding.top + plotHeight);
    ctx.lineTo(lineStartX, padding.top + plotHeight);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
    gradient.addColorStop(0, color + "33");
    gradient.addColorStop(1, color + "00");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw smooth line on top
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.y);
      if (index === 0) ctx.moveTo(x, y);
      else {
        const prevX = getX(index - 1);
        const prevY = getY(data[index - 1].y);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    });
    ctx.stroke();
    // Draw a single endpoint dot for the current (latest) value
    const dotX = getX(data.length - 1);
    const dotY = getY(data[data.length - 1].y);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
    // const step = Math.ceil(data.length / 8);
    // let lastX = -Infinity;
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    // data.forEach((point, index) => {
    //   if (index % step === 0 || index === data.length - 1) {
    //     const x = getX(index);
    //     // ctx.fillText(String(point.x), x, chartHeight - 20);
    //     ctx.fillText(typeof point.x === "number" ? point.x.toFixed(2) : String(point.x), x, chartHeight - 20);
    //   }
    // });
    // data.forEach((point, index) => {
    //   const x = getX(index);
    //   if (index % step === 0 || index === data.length - 1) {
    //     if (x - lastX > 35) {
    //       // ensures 35px minimum spacing
    //       ctx.fillText(typeof point.x === "number" ? point.x.toFixed(2) : String(point.x), x, chartHeight - 20);
    //       lastX = x;
    //     }
    //   }
    // });
    // Adjust x-axis label rendering to prevent overlap
    const step = Math.ceil(data.length / 10); // reduce number of labels
    let lastX = -Infinity;
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";

    data.forEach((point, index) => {
      const x = getX(index);
      if ((index % step === 0 || index === data.length - 1) && x - lastX > 50) {
        const label = typeof point.x === "number" ? point.x.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(point.x);
        ctx.fillText(label, x, chartHeight - 20);
        lastX = x;
      }
    });

    if (yAxisLabel) {
      ctx.save();
      ctx.translate(15, chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "#d1d5db";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(yAxisLabel, 0, 0);
      ctx.restore();
    }

    if (xAxisLabel) {
      ctx.fillStyle = "#d1d5db";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(xAxisLabel, width / 2, chartHeight - 5);
    }
  }, [data, color, yAxisLabel, xAxisLabel, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < padding.left || mouseX > rect.width - padding.right) {
      setTooltip(null);
      return;
    }

    const index = Math.round(((mouseX - padding.left) / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setTooltip({
        x: mouseX,
        y: mouseY,
        dataPoint: data[index],
      });
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 relative">
      <h3 className="text-sm font-medium text-gray-300 mb-4">{title}</h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: `${height}px` }}
          className="w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {/* {tooltip && (
          <div
            className="absolute pointer-events-none bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 40}px`,
              transform: tooltip.x > 200 ? "translateX(-100%) translateX(-20px)" : "none",
            }}
          >
            <div className="text-gray-300">
              <div className="font-semibold">{tooltip.dataPoint.x}</div>
              
              <div className="text-green-400">
                {typeof tooltip.dataPoint.y === "number"
                  ? tooltip.dataPoint.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : tooltip.dataPoint.y}
              </div>
            </div>
          </div>
        )} */}
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
              <div className="font-semibold">
                {typeof tooltip.dataPoint.x === "number"
                  ? tooltip.dataPoint.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : tooltip.dataPoint.x}
              </div>
              <div className="text-green-400">
                {typeof tooltip.dataPoint.y === "number"
                  ? tooltip.dataPoint.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : tooltip.dataPoint.y}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
