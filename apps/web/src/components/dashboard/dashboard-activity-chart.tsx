'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface ActivityChartPoint {
  label: string;
  fullLabel?: string;
  companies: number;
  reviewers: number;
}

interface DashboardActivityChartProps {
  data: ActivityChartPoint[];
  companiesLabel: string;
  reviewersLabel: string;
  emptyLabel?: string;
  className?: string;
  dualScale?: boolean;
  valueAxis?: 'percent' | 'count';
}

const PERCENT_TICKS = [50, 40, 30, 20, 10];

function buildCountTicks(maxValue: number): number[] {
  const max = Math.max(maxValue, 1);

  if (max <= 5) {
    return Array.from({ length: max + 1 }, (_, index) => max - index);
  }

  const tickCount = 5;
  return Array.from({ length: tickCount }, (_, index) =>
    Math.round((max * (tickCount - 1 - index)) / (tickCount - 1)),
  );
}

function smoothLinePath(points: Array<{ x: number; y: number }>): string {
  const first = points[0];
  if (!first) return '';
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let path = `M ${first.x} ${first.y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;
    const controlX = (previous.x + current.x) / 2;
    path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

function roundedBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}

export function DashboardActivityChart({
  data,
  companiesLabel,
  reviewersLabel,
  emptyLabel,
  className,
  dualScale = false,
  valueAxis = 'percent',
}: DashboardActivityChartProps) {
  const useCountAxis = valueAxis === 'count';
  const maxCompanies = Math.max(...data.map((point) => point.companies), 1);
  const maxReviewers = dualScale
    ? Math.max(...data.map((point) => point.reviewers), 5)
    : Math.max(...data.flatMap((point) => [point.companies, point.reviewers]), 1);
  const maxValue = useCountAxis
    ? Math.max(...data.flatMap((point) => [point.companies, point.reviewers]), 1)
    : dualScale
      ? maxCompanies
      : maxReviewers;
  const yTicks = useCountAxis ? buildCountTicks(maxValue) : PERCENT_TICKS;
  const yAxisMax = useCountAxis ? Math.max(maxValue, 1) : 50;
  const hasActivity = data.some((point) => point.companies > 0 || point.reviewers > 0);

  const width = 100;
  const height = 62;
  const padX = 4;
  const padTop = 4;
  const padBottom = 2;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const slotWidth = data.length > 0 ? chartW / data.length : chartW;
  const barWidth = slotWidth * 0.42;

  const scaleY = (value: number, max = maxValue) => padTop + chartH - (value / max) * chartH;

  const barCoords = data.map((point, index) => {
    const centerX = padX + slotWidth * index + slotWidth / 2;
    const barMax = useCountAxis ? maxValue : dualScale ? maxCompanies : maxValue;
    const barHeight = (point.companies / barMax) * chartH;
    const x = centerX - barWidth / 2;
    const y = padTop + chartH - barHeight;
    return { ...point, x, y, barHeight, centerX };
  });

  const lineCoords = data.map((point, index) => {
    const x = padX + slotWidth * index + slotWidth / 2;
    const lineMax = useCountAxis ? maxValue : dualScale ? maxReviewers : maxValue;
    const y = scaleY(point.reviewers, lineMax);
    return { ...point, x, y };
  });

  const linePath = smoothLinePath(lineCoords);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 start-0 flex w-10 flex-col justify-between py-1 text-[10px] tabular-nums text-secondary sm:text-xs">
          {yTicks.map((tick) => (
            <span key={tick}>{useCountAxis ? tick : `${tick}%`}</span>
          ))}
        </div>

        <div className="relative ms-10 h-64 sm:h-72">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            role="img"
            aria-label={emptyLabel}
          >
            {yTicks.map((tick) => {
              const y = padTop + chartH * (1 - tick / yAxisMax);
              return (
                <line
                  key={tick}
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  className="stroke-slate-200"
                  strokeWidth="0.25"
                  strokeDasharray="1.2 1.2"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {barCoords.map((bar) =>
              bar.barHeight > 0 ? (
                <path
                  key={`bar-${bar.label}`}
                  d={roundedBarPath(bar.x, bar.y, barWidth, bar.barHeight, barWidth * 0.35)}
                  className="fill-brand-500"
                >
                  <title>
                    {bar.fullLabel ?? bar.label} · {companiesLabel}: {bar.companies}
                  </title>
                </path>
              ) : null,
            )}

            {hasActivity && linePath ? (
              <>
                <path
                  d={linePath}
                  fill="none"
                  className="stroke-gold-300"
                  strokeWidth="0.85"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: 'drop-shadow(0px 1px 2px rgba(237, 197, 111, 0.45))' }}
                />
                {lineCoords.map((point) => (
                  <g key={`line-${point.label}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="1.35"
                      className="fill-white stroke-gold-300"
                      strokeWidth="0.55"
                      vectorEffect="non-scaling-stroke"
                    />
                    <title>
                      {point.fullLabel ?? point.label} · {reviewersLabel}: {point.reviewers}
                    </title>
                  </g>
                ))}
              </>
            ) : null}
          </svg>

          {!hasActivity && emptyLabel ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-secondary">
              {emptyLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className="ms-10 grid gap-1 text-center text-[10px] text-secondary sm:text-xs"
        style={{ gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))` }}
      >
        {data.map((point) => (
          <span key={point.label} className="truncate">
            {point.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-secondary shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden />
          {companiesLabel}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-secondary shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <span className="h-2.5 w-2.5 rounded-full bg-gold-300" aria-hidden />
          {reviewersLabel}
        </span>
      </div>
    </div>
  );
}

export function DashboardChartDailyFilter({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-secondary">
      {label}
      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
