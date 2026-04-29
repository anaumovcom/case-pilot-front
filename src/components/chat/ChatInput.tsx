import { Paperclip, SendHorizonal, X } from 'lucide-react';
import { useState } from 'react';

import type { Attachment } from '../../types';
import { Button } from '../ui/Button';

type Props = {
  onSend: (text: string) => void;
  onAttach: () => void;
  draftAttachments?: Attachment[];
  onRemoveDraftAttachment?: (attachmentId: string) => void;
  onOpenAttachmentDetails?: (attachment: Attachment) => void;
};

export function ChatInput({ onSend, onAttach, draftAttachments = [], onRemoveDraftAttachment, onOpenAttachmentDetails }: Props) {
  const [value, setValue] = useState('');

  const send = () => {
    if (!value.trim() && draftAttachments.length === 0) return;
    onSend(value.trim() || 'Проанализируй прикреплённые области OBD.');
    setValue('');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {draftAttachments.length > 0 ? (
        <div className="mb-3 space-y-2">
          {draftAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="cursor-pointer rounded-xl border border-blue-200 bg-blue-50 p-2 text-left text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-100/60"
              onClick={() => onOpenAttachmentDetails?.(attachment)}
            >
              <div className="flex items-start gap-2">
                {attachment.thumbnailDataUrl ? (
                  <img src={attachment.thumbnailDataUrl} alt={attachment.title} className="h-14 w-20 shrink-0 rounded-lg border border-blue-200 bg-white object-cover" />
                ) : (
                  <div className="case-grid-bg h-14 w-20 shrink-0 rounded-lg border border-dashed border-blue-300 bg-white" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">OBD</span>
                    {attachment.includedTypes?.includes('ocr') ? <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">OCR</span> : null}
                    <span className="min-w-0 truncate font-semibold text-slate-950">{attachment.title}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-slate-600">{attachment.comment || attachment.previewText || 'Выбранная область OBD'}</div>
                </div>
                <button
                  className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveDraftAttachment?.(attachment.id);
                  }}
                  aria-label="Удалить вложение"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <textarea
        rows={2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        placeholder={draftAttachments.length > 0 ? 'Напишите общее задание по прикреплённым областям...' : 'Написать сообщение агенту...'}
        className="case-scrollbar max-h-28 w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
      <div className="mt-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onAttach}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button variant="primary" size="sm" onClick={send} disabled={!value.trim() && draftAttachments.length === 0}>
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
