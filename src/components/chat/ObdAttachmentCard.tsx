import { MonitorUp } from 'lucide-react';

import type { Attachment } from '../../types';

type Props = {
  attachment: Attachment;
  onOpenDetails?: (attachment: Attachment) => void;
};

export function ObdAttachmentCard({ attachment, onOpenDetails }: Props) {
  return (
    <button className="mt-3 w-full rounded-xl border border-blue-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50" onClick={() => onOpenDetails?.(attachment)}>
      <div className="flex items-start gap-3">
        {attachment.thumbnailDataUrl ? (
          <img src={attachment.thumbnailDataUrl} alt={attachment.title} className="h-16 w-24 shrink-0 rounded-lg border border-blue-200 bg-blue-50/50 object-cover" />
        ) : (
          <div className="case-grid-bg h-16 w-24 shrink-0 rounded-lg border border-dashed border-blue-400 bg-blue-50/50" />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700">
            <MonitorUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">OBD</span>
            {attachment.includedTypes?.includes('ocr') ? <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">OCR</span> : null}
            <span className="min-w-0 truncate">{attachment.title}</span>
          </div>
          <div className="text-xs leading-5 text-slate-600">{attachment.comment || attachment.previewText || 'Выбранная область OBD'}</div>
        </div>
      </div>
    </button>
  );
}
