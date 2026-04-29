import type { CaseStatus } from '../../types';
import { Badge } from '../ui/Badge';

type Props = {
  status: CaseStatus;
};

const map: Record<CaseStatus, 'blue' | 'green' | 'yellow' | 'red' | 'slate'> = {
  Новый: 'blue',
  'В работе': 'yellow',
  'Ждёт ответа': 'blue',
  'Нужен анализ': 'red',
  'Есть решение': 'green',
  Закрыт: 'slate',
  Отложен: 'slate',
};

export function CaseStatusBadge({ status }: Props) {
  return <Badge variant={map[status]}>{status}</Badge>;
}
