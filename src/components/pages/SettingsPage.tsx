import { Bot, Eye, KeyRound, Languages, ShieldCheck, SlidersHorizontal } from 'lucide-react';

import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { PageShell } from './CasesPage';

const sections = [
  { title: 'Модели', icon: SlidersHorizontal, text: 'Автоматический выбор между ChatGPT, Ollama и vision-моделями.' },
  { title: 'Агенты', icon: Bot, text: 'Агент по экрану, аналитик кейса, агент памяти и агент поиска.' },
  { title: 'Внешний API', icon: KeyRound, text: 'Ключи внешних LLM API и лимиты запросов.' },
  { title: 'OCR', icon: Languages, text: 'Языки распознавания, качество и обработка выделенной области.' },
  { title: 'Безопасность действий', icon: ShieldCheck, text: 'Подтверждение опасных действий и аварийная остановка ESP32.' },
  { title: 'Интерфейс', icon: Eye, text: 'Тема, плотность отображения, масштаб OBD и уведомления.' },
];

export function SettingsPage() {
  return (
    <PageShell title="Настройки">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
                <h3 className="font-semibold text-slate-950">{section.title}</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-500">{section.text}</p>
              <Select>
                <option>Настроено</option>
                <option>Требует проверки</option>
              </Select>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
