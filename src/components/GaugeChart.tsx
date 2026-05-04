import { useEffect, useRef } from 'react';
import { getStatusColor } from '../utils/thresholds';
import { ThresholdStatus } from '../types/engine';

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit?: string;
  status: ThresholdStatus;
  thresholds?: { critical: number; warning: number };
}

export function GaugeChart({ value, min, max, title, unit, status, thresholds }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 20;
    const radius = Math.min(width, height) / 2 - 30;

    ctx.clearRect(0, 0, width, height);

    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const angleRange = endAngle - startAngle;

    ctx.lineWidth = 20;
    ctx.lineCap = 'round';

    const drawArc = (start: number, end: number, color: string) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, start, end);
      ctx.strokeStyle = color;
      ctx.stroke();
    };

    if (thresholds) {
      const criticalAngle = startAngle + (thresholds.critical / (max - min)) * angleRange;
      const warningAngle = startAngle + (thresholds.warning / (max - min)) * angleRange;

      drawArc(startAngle, criticalAngle, '#ef4444');
      drawArc(criticalAngle, warningAngle, '#f59e0b');
      drawArc(warningAngle, endAngle, '#10b981');
    } else {
      drawArc(startAngle, endAngle, '#374151');
    }

    const valueAngle = startAngle + ((value - min) / (max - min)) * angleRange;
    const needleLength = radius - 10;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + needleLength * Math.cos(valueAngle),
      centerY + needleLength * Math.sin(valueAngle)
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = getStatusColor(status);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = getStatusColor(status);
    ctx.fill();

    ctx.fillStyle = '#f3f4f6';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(value.toFixed(1), centerX, centerY - 30);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    if (unit) {
      ctx.fillText(unit, centerX, centerY - 10);
    }

  }, [value, min, max, status, thresholds]);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
      <h3 className="text-sm font-medium text-gray-400 mb-4 text-center">{title}</h3>
      <canvas ref={canvasRef} width={280} height={180} className="mx-auto" />
    </div>
  );
}
