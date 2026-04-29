import { ArrowDownUp, Cpu, Database, Gauge, HardDrive, RefreshCw, Server, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

import { diagnosticsService } from '../../services';
import type { ComponentStatus } from '../../services';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageShell } from './CasesPage';

const resourceMetrics = [
  { label: 'CPU', value: '38%', detail: '8 ядер · пик 61%', icon: Cpu, variant: 'green' as const },
  { label: 'RAM', value: '6.4 / 16 GB', detail: 'использовано 40%', icon: Server, variant: 'green' as const },
  { label: 'Disk space', value: '128 / 512 GB', detail: 'свободно 384 GB', icon: HardDrive, variant: 'green' as const },
  { label: 'Задержка API', value: '42 мс', detail: 'p95: 88 мс', icon: Timer, variant: 'green' as const },
];

const dbDetails = [
  ['Тип БД', 'PostgreSQL 16'],
  ['Хост', 'db.casepilot.local:5432'],
  ['База', 'casepilot_app'],
  ['Размер', '1.8 GB'],
  ['Таблиц', '42'],
  ['Индексов', '67'],
  ['Активные соединения', '18 / 100'],
  ['Пул соединений', '32 max · 14 idle'],
  ['Миграции', 'актуальны'],
  ['Репликация', 'primary · lag 0 мс'],
  ['Backup', 'последний в 11:00'],
  ['Slow queries', '2 за последний час'],
];

const performanceMetrics = [
  { label: 'Средняя скорость запросов', value: '124 req/min', detail: 'пик 310 req/min', icon: ArrowDownUp },
  { label: 'Среднее время запроса', value: '64 мс', detail: 'p95 142 мс · p99 280 мс', icon: Gauge },
  { label: 'Среднее время ответа', value: '91 мс', detail: 'backend + DB + serialization', icon: Timer },
  { label: 'DB query avg', value: '18 мс', detail: 'p95 47 мс · slow > 500 мс', icon: Database },
];

const latencyMetrics = [
  ['Frontend → Backend', '42 мс', 'OK'],
  ['Backend → DB', '18 мс', 'OK'],
  ['Backend → Vector DB', '210 мс', 'Warning'],
  ['Backend → Ollama', '1.8 с', 'Warning'],
  ['Backend → External LLM API', '530 мс', 'OK'],
  ['OBD stream latency', '82 мс', 'OK'],
  ['ESP32 HID command ack', '24 мс', 'OK'],
  ['OCR processing avg', '132 мс', 'OK'],
];

export function DiagnosticsPage() {
  const [components, setComponents] = useState<ComponentStatus[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await diagnosticsService.components();
      setComponents(response.items ?? []);
    };
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const visibleComponents = components.length > 0 ? components : [];

  return (
    <PageShell title="Диагностика">
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resourceMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
                <Badge variant={metric.variant}>OK</Badge>
              </div>
              <div className="text-sm font-medium text-slate-500">{metric.label}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-950">{metric.value}</div>
              <div className="mt-2 text-sm text-slate-500">{metric.detail}</div>
            </Card>
          );
        })}
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Database className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">База данных</h2>
                <p className="text-sm text-slate-500">Подробная техническая информация и состояние хранилища.</p>
              </div>
            </div>
            <Badge variant="green">OK</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {dbDetails.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Gauge className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Скорости и ответы</h2>
              <p className="text-sm text-slate-500">Средние показатели запросов, ответов и DB-запросов.</p>
            </div>
          </div>
          <div className="space-y-3">
            {performanceMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-950">{metric.label}</div>
                    <div className="text-xs text-slate-500">{metric.detail}</div>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{metric.value}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-950">Задержки между компонентами</div>
        <div className="grid grid-cols-[1.5fr_160px_120px] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Маршрут</span><span>Задержка</span><span>Статус</span>
        </div>
        {latencyMetrics.map(([route, latency, status]) => (
          <div key={route} className="grid grid-cols-[1.5fr_160px_120px] items-center border-t border-slate-100 px-5 py-3 text-sm">
            <span className="font-medium text-slate-800">{route}</span>
            <span className="text-slate-600">{latency}</span>
            <Badge variant={status === 'OK' ? 'green' : 'yellow'}>{status}</Badge>
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.4fr_120px_140px_160px_180px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Компонент</span><span>Статус</span><span>Время ответа</span><span>Последняя проверка</span><span>Действия</span>
        </div>
        {visibleComponents.map((item) => {
          const ok = item.status === 'online' || item.status === 'ready' || item.status === 'postgres';
          return (
          <div key={item.id} className="grid grid-cols-[1.4fr_120px_140px_160px_180px] items-center border-b border-slate-100 px-5 py-4 text-sm last:border-0">
            <span className="font-semibold text-slate-950">{item.name}</span>
            <Badge variant={ok ? 'green' : 'yellow'}>{item.status ?? 'unknown'}</Badge>
            <span className="text-slate-600">{item.latency_ms == null ? '—' : `${item.latency_ms} мс`}</span>
            <span className="text-slate-500">сейчас</span>
            <Button size="sm" variant="outline"><RefreshCw className="h-4 w-4" /> Повторить проверку</Button>
          </div>
          );
        })}
      </Card>
    </PageShell>
  );
}
