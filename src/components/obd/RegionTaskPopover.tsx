import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type Props = {
  anchorRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  onClose: () => void;
  onAttach: (payload: { comment?: string; includedTypes: Array<'screenshot' | 'ocr'> }) => void;
};

export function RegionTaskPopover({ anchorRect, onClose, onAttach }: Props) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [comment, setComment] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [includeOcr, setIncludeOcr] = useState(true);

  useEffect(() => {
    const popover = popoverRef.current;
    const parent = popover?.offsetParent instanceof HTMLElement ? popover.offsetParent : popover?.parentElement;
    if (!popover || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const gap = 12;
    const popoverWidth = popover.offsetWidth || 320;
    const popoverHeight = popover.offsetHeight || 260;
    const fallback = {
      x: parentRect.width * 0.58,
      y: parentRect.height * 0.53,
      width: 0,
      height: 0,
    };
    const anchor = anchorRect ?? fallback;
    const rightSpace = parentRect.width - (anchor.x + anchor.width);
    const leftSpace = anchor.x;
    const bottomSpace = parentRect.height - (anchor.y + anchor.height);
    let left = anchor.x + anchor.width + gap;
    let top = anchor.y;

    if (rightSpace >= popoverWidth + gap) {
      left = anchor.x + anchor.width + gap;
      top = anchor.y;
    } else if (leftSpace >= popoverWidth + gap) {
      left = anchor.x - popoverWidth - gap;
      top = anchor.y;
    } else if (bottomSpace >= popoverHeight + gap) {
      left = anchor.x;
      top = anchor.y + anchor.height + gap;
    } else {
      left = anchor.x;
      top = anchor.y - popoverHeight - gap;
    }

    popover.style.left = `${Math.max(gap, Math.min(left, parentRect.width - popoverWidth - gap))}px`;
    popover.style.top = `${Math.max(gap, Math.min(top, parentRect.height - popoverHeight - gap))}px`;
  }, [anchorRect]);

  return (
    <div ref={popoverRef} className="absolute z-30 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-soft" onMouseDown={(event) => event.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Задача по выделенной области</h3>
          <p className="mt-0.5 text-xs text-slate-500">Прикрепите область к черновику сообщения агенту.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть задачу по области">
          <X className="h-4 w-4" />
        </button>
      </div>
      {anchorRect ? <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Координаты: x {Math.round(anchorRect.x)}, y {Math.round(anchorRect.y)}, w {Math.round(anchorRect.width)}, h {Math.round(anchorRect.height)}</div> : null}
      <label className="mb-1 block text-xs font-semibold text-slate-700">Комментарий к этой области</label>
      <Input autoFocus value={comment} onChange={(event) => setComment(event.target.value)} className="mb-3 h-9 text-xs" placeholder="Введите задание или пояснение..." />
      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-xs font-semibold text-slate-700">Что прикрепить к сообщению</div>
        <div className="space-y-2">
          <Checkbox label="Скриншот выделенной области" checked={includeScreenshot} onChange={(event) => setIncludeScreenshot(event.target.checked)} />
          <Checkbox label="OCR-текст этой области" checked={includeOcr} onChange={(event) => setIncludeOcr(event.target.checked)} />
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        disabled={!includeScreenshot && !includeOcr}
        onClick={() => onAttach({ comment: comment.trim() || undefined, includedTypes: [includeScreenshot ? 'screenshot' : null, includeOcr ? 'ocr' : null].filter((item): item is 'screenshot' | 'ocr' => Boolean(item)) })}
      >
        Прикрепить к сообщению
      </Button>
    </div>
  );
}
