import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  x: number;
  y: number;
}

interface InteractiveChartProps {
  data: DataPoint[];
  title: string;
  color: string;
  yAxisLabel: string;
  xAxisLabel: string;
  height?: number;
  showStats?: boolean;
}

export function InteractiveChart({
  data,
  title,
  color,
  yAxisLabel,
  xAxisLabel,
  height = 280,
  showStats = true,
}: InteractiveChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const stats = useMemo(() => {
    const values = data.map(d => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;

    return { min, max, avg, change, changePercent };
  }, [data]);

  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const maxX = Math.max(...data.map(d => d.x));
  const minX = Math.min(...data.map(d => d.x));
  const rangeY = maxY - minY;
  const rangeX = maxX - minX;

  const chartPadding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  const getX = (value: number) =>
    chartPadding.left + ((value - minX) / rangeX) * innerWidth;
  const getY = (value: number) =>
    chartPadding.top + innerHeight - ((value - minY) / rangeY) * innerHeight;

  const pathData = data.map((point, i) => {
    const x = getX(point.x);
    const y = getY(point.y);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaPath = `${pathData} L ${getX(data[data.length - 1].x)} ${chartPadding.top + innerHeight} L ${getX(data[0].x)} ${chartPadding.top + innerHeight} Z`;

  const getTrendIcon = () => {
    if (stats.change > 0) return <TrendingUp className="w-4 h-4" />;
    if (stats.change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (stats.change > 0) return 'text-green-500';
    if (stats.change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showStats && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-semibold">
              {stats.changePercent > 0 ? '+' : ''}
              {stats.changePercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {showStats && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-900/70 rounded-lg p-2 border border-gray-800">
            <p className="text-xs text-gray-500">Min</p>
            <p className="text-sm font-semibold text-white">{stats.min.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-2 border border-gray-800">
            <p className="text-xs text-gray-500">Max</p>
            <p className="text-sm font-semibold text-white">{stats.max.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-2 border border-gray-800">
            <p className="text-xs text-gray-500">Avg</p>
            <p className="text-sm font-semibold text-white">{stats.avg.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900/70 rounded-lg p-2 border border-gray-800">
            <p className="text-xs text-gray-500">Change</p>
            <p className={`text-sm font-semibold ${getTrendColor()}`}>
              {stats.change > 0 ? '+' : ''}{stats.change.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>

          <g>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = chartPadding.top + (innerHeight / 4) * i;
              const value = maxY - (rangeY / 4) * i;
              return (
                <g key={i}>
                  <line
                    x1={chartPadding.left}
                    y1={y}
                    x2={chartPadding.left + innerWidth}
                    y2={y}
                    stroke="#374151"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartPadding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#9CA3AF"
                    fontSize="12"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {data.filter((_, i) => i % Math.ceil(data.length / 8) === 0).map((point) => {
              const x = getX(point.x);
              return (
                <g key={point.x}>
                  <line
                    x1={x}
                    y1={chartPadding.top}
                    x2={x}
                    y2={chartPadding.top + innerHeight}
                    stroke="#374151"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={x}
                    y={chartPadding.top + innerHeight + 20}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="12"
                  >
                    {point.x}
                  </text>
                </g>
              );
            })}
          </g>

          <path
            d={areaPath}
            fill={`url(#gradient-${title})`}
            className="transition-all duration-300"
          />

          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {data.map((point, index) => {
            const x = getX(point.x);
            const y = getY(point.y);
            const isHovered = hoveredIndex === index;

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={color}
                  stroke="#1F2937"
                  strokeWidth="2"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => {
                    setHoveredPoint(point);
                    setHoveredIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoveredIndex(null);
                  }}
                />
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={10}
                    fill={color}
                    opacity="0.2"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          {hoveredPoint && hoveredIndex !== null && (
            <g>
              <rect
                x={getX(hoveredPoint.x) - 60}
                y={getY(hoveredPoint.y) - 50}
                width="120"
                height="40"
                fill="#1F2937"
                stroke={color}
                strokeWidth="2"
                rx="6"
              />
              <text
                x={getX(hoveredPoint.x)}
                y={getY(hoveredPoint.y) - 32}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="11"
              >
                {xAxisLabel}: {hoveredPoint.x}
              </text>
              <text
                x={getX(hoveredPoint.x)}
                y={getY(hoveredPoint.y) - 18}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="13"
                fontWeight="bold"
              >
                {hoveredPoint.y.toFixed(2)}
              </text>
            </g>
          )}

          <text
            x={chartPadding.left - 45}
            y={chartPadding.top + innerHeight / 2}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
            transform={`rotate(-90 ${chartPadding.left - 45} ${chartPadding.top + innerHeight / 2})`}
          >
            {yAxisLabel}
          </text>

          <text
            x={chartPadding.left + innerWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
          >
            {xAxisLabel}
          </text>
        </svg>
      </div>
    </div>
  );
}
