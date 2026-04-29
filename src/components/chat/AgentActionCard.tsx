import { CheckCircle2, Copy, Cpu, ExternalLink, Pencil } from 'lucide-react';

import type { AgentActionCard as AgentActionCardType } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type Props = {
  card: AgentActionCardType;
  onExecute: (cardId: string) => void;
  onToast: (title: string, description?: string) => void;
};

export function AgentActionCard({ card, onExecute, onToast }: Props) {
  const executed = card.status === 'executed';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">{card.title}</h3>
        <Badge variant={executed ? 'green' : 'blue'}>{executed ? 'Выполнено' : 'Готово'}</Badge>
      </div>
      <div className="space-y-3 text-sm text-slate-700">
        <div><span className="font-semibold text-slate-950">Тип:</span> Ввод текста</div>
        {card.targetRegion ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Целевая область: x {card.targetRegion.x}, y {card.targetRegion.y}, w {card.targetRegion.width}, h {card.targetRegion.height}
          </div>
        ) : null}
        <div>
          <div className="mb-1 font-semibold text-slate-950">Текст для вставки:</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">“{card.textToInsert}”</div>
        </div>
        <p className="text-sm leading-5 text-slate-500">{card.explanation}</p>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          Выполнение через ESP32 требует подтверждения пользователя.
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <Button variant="primary" size="sm" onClick={() => onExecute(card.id)} disabled={executed}>
          {executed ? <CheckCircle2 className="h-4 w-4" /> : <Cpu className="h-4 w-4" />} {executed ? 'Выполнено через ESP32' : 'Выполнить через ESP32'}
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" onClick={() => onToast('Редактирование текста', 'На моках открыт режим изменения текста')}>
            <Pencil className="h-4 w-4" /> Изменить
          </Button>
          <Button size="sm" onClick={() => onToast('Текст скопирован', card.textToInsert)}>
            <Copy className="h-4 w-4" /> Скопировать
          </Button>
          <Button size="sm" onClick={() => onToast('Открыто в чате', 'Карточка действия закреплена в текущем чате')}>
            <ExternalLink className="h-4 w-4" /> Открыть
          </Button>
        </div>
      </div>
    </div>
  );
}
