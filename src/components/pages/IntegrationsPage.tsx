import { AlertTriangle, Bot, CheckCircle2, Database, Eye, KeyRound, Languages, Monitor, Save, Send, ShieldCheck, SlidersHorizontal, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

import { diagnosticsService } from '../../services';
import type { IntegrationStatus } from '../../services';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PageShell } from './CasesPage';

const settingsSections = [
  { title: 'Модели', icon: SlidersHorizontal, value: 'ChatGPT / Ollama Auto', text: 'Автоматический выбор между локальными и внешними моделями.', options: ['ChatGPT / Ollama Auto', 'Только Ollama', 'Только внешние API'] },
  { title: 'Агенты', icon: Bot, value: 'Агент по экрану', text: 'Основной агент для OBD-области, OCR и действий через ESP32.', options: ['Агент по экрану', 'Аналитик кейса', 'Технический агент'] },
  { title: 'Внешние API', icon: KeyRound, value: 'Ключ задан', text: 'Лимиты, ключи и fallback на локальные модели.', options: ['Ключ задан', 'Требует ключ', 'Отключено'] },
  { title: 'OCR', icon: Languages, value: 'Русский + English', text: 'Распознавание выделенной области и полного экрана OBD.', options: ['Русский + English', 'Только русский', 'Автоопределение'] },
  { title: 'Безопасность', icon: ShieldCheck, value: 'Подтверждение включено', text: 'Опасные действия требуют ручного подтверждения пользователя.', options: ['Подтверждение включено', 'Только опасные действия', 'Строгий режим'] },
  { title: 'Интерфейс', icon: Eye, value: 'Светлая тема', text: 'Масштаб OBD, плотность таблиц и уведомления.', options: ['Светлая тема', 'Компактный режим', 'Увеличенный масштаб'] },
];

const statusSections = [
  { title: 'Telegram', icon: Send, status: 'OK', value: 'импорт доступен', checkedAt: '11:30', details: ['Чаты доступны', 'Контекст до/после: 5 сообщений', 'Вложения сохраняются'] },
  { title: 'OBD', icon: Monitor, status: 'OK', value: 'онлайн', checkedAt: '11:31', details: ['FPS 24', 'Задержка 82 мс', 'Скриншоты включены'] },
  { title: 'ESP32 HID', icon: Wifi, status: 'OK', value: 'подключено', checkedAt: '11:31', details: ['Мышь подключена', 'Клавиатура подключена', 'Стоп управление активен'] },
  { title: 'Память и поиск', icon: Database, status: 'Warning', value: 'индекс обновляется', checkedAt: '10:55', details: ['Память кейса доступна', 'OCR индексируется', 'Векторная база обновляется'] },
  { title: 'Ollama', icon: Bot, status: 'Warning', value: 'медленный ответ', checkedAt: '11:12', details: ['Локальная модель доступна', 'Средний ответ 1.8 с', 'Fallback включён'] },
  { title: 'Внешние API', icon: KeyRound, status: 'OK', value: 'доступны', checkedAt: '11:29', details: ['Ключ задан', 'Vision-модель доступна', 'Лимиты в норме'] },
];

const serviceSettings = [
  {
    title: 'Telegram',
    icon: Send,
    fields: [
      { label: 'Режим подключения', value: 'Плагин выбора сообщений', type: 'select', options: ['Плагин выбора сообщений', 'Bot API', 'Ручной импорт'] },
      { label: 'Доступные чаты', value: 'Поддержка CRM, ТехноЛюкс, Операторы OBD' },
      { label: 'Контекст до/после', value: '5 сообщений' },
      { label: 'Вложения', value: 'Сохранять', type: 'select', options: ['Сохранять', 'Только ссылки', 'Не сохранять'] },
    ],
  },
  {
    title: 'OBD',
    icon: Monitor,
    fields: [
      { label: 'Источник трансляции', value: 'https://obd.local/stream' },
      { label: 'Качество', value: '1080p', type: 'select', options: ['720p', '1080p', '1440p'] },
      { label: 'FPS', value: '24' },
      { label: 'OCR области', value: 'Автоматически после выделения', type: 'select', options: ['Автоматически после выделения', 'Только вручную', 'Отключено'] },
    ],
  },
  {
    title: 'ESP32 HID',
    icon: Wifi,
    fields: [
      { label: 'Адрес ESP32', value: '192.168.31.234' },
      { label: 'Режим мыши', value: 'Относительный', type: 'select', options: ['Относительный', 'Абсолютный'] },
      { label: 'Задержка ввода', value: '40 мс' },
      { label: 'Опасные действия', value: 'Всегда подтверждать', type: 'select', options: ['Всегда подтверждать', 'Подтверждать Enter/Submit', 'Строгий режим'] },
    ],
  },
  {
    title: 'Ollama',
    icon: Bot,
    fields: [
      { label: 'Адрес сервера', value: 'http://localhost:11434' },
      { label: 'Модель по умолчанию', value: 'llama3.1', type: 'select', options: ['llama3.1', 'qwen2.5', 'mistral'] },
      { label: 'Таймаут', value: '45 секунд' },
      { label: 'Fallback', value: 'Внешняя модель при медленном ответе', type: 'select', options: ['Внешняя модель при медленном ответе', 'Не использовать', 'Только вручную'] },
    ],
  },
  {
    title: 'Vision модель',
    icon: Eye,
    fields: [
      { label: 'Провайдер', value: 'ChatGPT Vision', type: 'select', options: ['ChatGPT Vision', 'Ollama Vision', 'Auto'] },
      { label: 'Использовать для', value: 'OBD-области и полного экрана' },
      { label: 'Сжатие изображений', value: 'Авто', type: 'select', options: ['Авто', 'Без сжатия', 'Экономный режим'] },
      { label: 'Приватные данные', value: 'Скрывать перед отправкой', type: 'select', options: ['Скрывать перед отправкой', 'Отправлять после подтверждения', 'Не отправлять'] },
    ],
  },
  {
    title: 'Память',
    icon: Database,
    fields: [
      { label: 'Память кейса', value: 'Включена', type: 'select', options: ['Включена', 'Только вручную', 'Отключена'] },
      { label: 'Общая память', value: 'Использовать по запросу', type: 'select', options: ['Использовать по запросу', 'Всегда использовать', 'Отключена'] },
      { label: 'Векторная база', value: 'CasePilot local index' },
      { label: 'Автовыжимка', value: 'После важных событий', type: 'select', options: ['После важных событий', 'Только по кнопке', 'Отключена'] },
    ],
  },
];

const statusIcons: Record<string, typeof Wifi> = {
  telegram: Send,
  obd: Monitor,
  esp32: Wifi,
  postgres: Database,
  qdrant: Database,
  omniparser: Languages,
  llm: Bot,
};

function isOnline(status: string | null) {
  return status === 'online' || status === 'ready' || status === 'postgres';
}

function detailsFor(item: IntegrationStatus) {
  const details = item.details ?? {};
  if (item.id === 'obd') {
    return [
      `Источник: ${String(details.source ?? 'unknown')}`,
      `FPS: ${String(details.fps ?? '—')}`,
      `Задержка: ${String(details.latency_ms ?? '—')} мс`,
    ];
  }
  if (item.id === 'esp32') {
    const hidReady = details.hid_ready === true || details.hidReady === true;
    return [
      `IP: ${String(details.ip ?? '—')}`,
      `Firmware: ${String(details.firmware_version ?? details.fw ?? '—')}`,
      `HID: ${hidReady ? 'ready' : 'not ready'}`,
    ];
  }
  return [`Статус: ${item.status ?? 'unknown'}`, `Настроено: ${item.configured ? 'да' : 'нет'}`];
}

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'statuses'>('settings');
  const [runtimeStatuses, setRuntimeStatuses] = useState<IntegrationStatus[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await diagnosticsService.integrations();
      setRuntimeStatuses(response.items ?? []);
    };
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const visibleStatuses = runtimeStatuses.length > 0
    ? runtimeStatuses.map((item) => ({
      title: item.name,
      icon: statusIcons[item.id] ?? CheckCircle2,
      status: isOnline(item.status) ? 'OK' : 'Warning',
      value: item.status ?? 'unknown',
      checkedAt: 'сейчас',
      details: detailsFor(item),
    }))
    : statusSections;
  const hasWarnings = visibleStatuses.some((item) => item.status !== 'OK');

  return (
    <PageShell title="Интеграции и настройки">
      <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('settings')}
        >
          Настройки
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'statuses' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('statuses')}
        >
          Статусы
        </button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid gap-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Общие параметры системы</h2>
                <p className="mt-1 text-sm text-slate-500">Только настройки работы приложения и текущие статусы компонентов.</p>
              </div>
              <Button variant="primary"><Save className="h-4 w-4" /> Сохранить настройки</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
                      <div>
                        <h3 className="font-semibold text-slate-950">{section.title}</h3>
                        <div className="text-xs text-slate-500">{section.value}</div>
                      </div>
                    </div>
                    <p className="mb-3 min-h-10 text-sm leading-5 text-slate-500">{section.text}</p>
                    <Select>
                      {section.options.map((option) => <option key={option}>{option}</option>)}
                    </Select>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Настройки подключений и сервисов</h2>
              <p className="mt-1 text-sm text-slate-500">Telegram, OBD, ESP32, Ollama, Vision-модель и память.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {serviceSettings.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
                      <h3 className="font-semibold text-slate-950">{service.title}</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {service.fields.map((field) => (
                        <label key={`${service.title}-${field.label}`} className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-500">{field.label}</span>
                          {field.type === 'select' ? (
                            <Select>
                              {field.options?.map((option) => <option key={option}>{option}</option>)}
                            </Select>
                          ) : (
                            <Input defaultValue={field.value} />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === 'statuses' ? (
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Статусы компонентов</h2>
                <p className="text-sm text-slate-500">Состояние подключений и системных сервисов без дополнительных действий.</p>
              </div>
            </div>
            <Badge variant="green">Готово к работе</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleStatuses.map((item) => {
              const Icon = item.icon;
              const ok = item.status === 'OK';
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 place-items-center rounded-xl ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}><Icon className="h-5 w-5" /></span>
                      <div>
                        <h3 className="font-semibold text-slate-950">{item.title}</h3>
                        <div className="text-sm text-slate-500">{item.value}</div>
                      </div>
                    </div>
                    <Badge variant={ok ? 'green' : 'yellow'}>{item.status}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {item.details.map((detail) => <StatusLine key={detail} label={detail} ok={ok} />)}
                  </div>
                  <div className="mt-3 text-xs text-slate-400">Последняя проверка: {item.checkedAt}</div>
                </div>
              );
            })}
          </div>
          {hasWarnings ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Требует внимания</div>
              Один или несколько сервисов сейчас отвечают не в штатном режиме. Проверьте карточки со статусом Warning.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Все проверенные подключения отвечают штатно.
            </div>
          )}
        </Card>
      ) : null}
    </PageShell>
  );
}

function StatusLine({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-slate-500"><span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {ok ? 'OK' : 'Warning'}</span>
    </div>
  );
}
