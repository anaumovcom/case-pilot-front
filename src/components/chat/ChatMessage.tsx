import { Bot, UserRound } from 'lucide-react';

import type { Attachment, ChatMessage as ChatMessageType } from '../../types';
import { AgentActionCard } from './AgentActionCard';
import { ObdAttachmentCard } from './ObdAttachmentCard';

type Props = {
  message: ChatMessageType;
  onExecuteAction: (cardId: string) => void;
  onOpenAttachmentDetails: (attachment: Attachment) => void;
  onToast: (title: string, description?: string) => void;
};

export function ChatMessage({ message, onExecuteAction, onOpenAttachmentDetails, onToast }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] ${isUser ? 'rounded-2xl border border-blue-200 bg-blue-50 p-4 text-slate-800' : 'w-full'}`}>
        <div className={`mb-2 flex items-center gap-2 text-xs ${isUser ? 'justify-start text-slate-600' : 'text-slate-500'}`}>
          <span className={`grid h-6 w-6 place-items-center rounded-full ${isUser ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
            {isUser ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          </span>
          <strong className="text-slate-950">{message.authorName}</strong>
          <span>{message.time}</span>
        </div>
        {message.attachments?.map((attachment) => <ObdAttachmentCard key={attachment.id} attachment={attachment} onOpenDetails={onOpenAttachmentDetails} />)}
        {message.text ? <p className="mt-3 text-sm leading-5">{message.text}</p> : null}
        {message.actionCard ? <AgentActionCard card={message.actionCard} onExecute={onExecuteAction} onToast={onToast} /> : null}
      </div>
    </div>
  );
}
