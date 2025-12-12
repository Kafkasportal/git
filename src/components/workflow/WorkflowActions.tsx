'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  WorkflowStage,
  WorkflowAction,
  STAGE_LABELS,
  ACTION_LABELS,
} from '@/lib/beneficiary/workflow-engine';
import {
  Send,
  Eye,
  HelpCircle,
  FilePlus,
  CheckCircle,
  XCircle,
  Truck,
  CheckSquare,
  Ban,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Icon mapping for actions
const ACTION_ICONS: Record<WorkflowAction, React.ReactNode> = {
  [WorkflowAction.SUBMIT]: <Send className="h-4 w-4" />,
  [WorkflowAction.START_REVIEW]: <Eye className="h-4 w-4" />,
  [WorkflowAction.REQUEST_INFO]: <HelpCircle className="h-4 w-4" />,
  [WorkflowAction.PROVIDE_INFO]: <FilePlus className="h-4 w-4" />,
  [WorkflowAction.APPROVE]: <CheckCircle className="h-4 w-4" />,
  [WorkflowAction.REJECT]: <XCircle className="h-4 w-4" />,
  [WorkflowAction.START_DISTRIBUTION]: <Truck className="h-4 w-4" />,
  [WorkflowAction.COMPLETE]: <CheckSquare className="h-4 w-4" />,
  [WorkflowAction.CANCEL]: <Ban className="h-4 w-4" />,
  [WorkflowAction.REOPEN]: <RefreshCw className="h-4 w-4" />,
};

// Actions that require comment
const COMMENT_REQUIRED_ACTIONS = [
  WorkflowAction.REQUEST_INFO,
  WorkflowAction.PROVIDE_INFO,
  WorkflowAction.REJECT,
  WorkflowAction.CANCEL,
  WorkflowAction.REOPEN,
];

// Actions that are destructive
const DESTRUCTIVE_ACTIONS = [
  WorkflowAction.REJECT,
  WorkflowAction.CANCEL,
];

interface WorkflowActionsProps {
  entityId: string;
  currentStage: WorkflowStage;
  onActionComplete?: (newStage: WorkflowStage) => void;
  className?: string;
}

interface AvailableAction {
  action: WorkflowAction;
  label: string;
  icon: string;
  targetStage: WorkflowStage;
}

/**
 * Workflow aksiyon butonları
 */
export function WorkflowActions({
  entityId,
  currentStage,
  onActionComplete,
  className,
}: WorkflowActionsProps) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<WorkflowAction | null>(null);
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState<string>('normal');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch available actions
  const { data: actionsData, isLoading: isLoadingActions } = useQuery({
    queryKey: ['workflow-actions', currentStage],
    queryFn: async () => {
      const response = await fetch('/api/beneficiaries/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage }),
      });
      if (!response.ok) throw new Error('Aksiyonlar alınamadı');
      return response.json();
    },
  });

  const availableActions: AvailableAction[] = actionsData?.data?.availableActions || [];

  // Perform action mutation
  const actionMutation = useMutation({
    mutationFn: async (data: { action: WorkflowAction; comment?: string; priority?: string }) => {
      const response = await fetch(`/api/beneficiaries/${entityId}/workflow`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'İşlem başarısız');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const newStage = data.data.newStage as WorkflowStage;
      toast.success(data.message || 'İşlem başarılı');
      setDialogOpen(false);
      setComment('');
      setSelectedAction(null);

      // Invalidate queries
      void queryClient.invalidateQueries({ queryKey: ['beneficiary', entityId] });
      void queryClient.invalidateQueries({ queryKey: ['workflow-actions'] });
      void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });

      onActionComplete?.(newStage);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'İşlem sırasında bir hata oluştu');
    },
  });

  const handleActionClick = (action: WorkflowAction) => {
    const requiresComment = COMMENT_REQUIRED_ACTIONS.includes(action);
    const isDestructive = DESTRUCTIVE_ACTIONS.includes(action);

    if (requiresComment || isDestructive) {
      setSelectedAction(action);
      setDialogOpen(true);
    } else {
      actionMutation.mutate({ action, priority });
    }
  };

  const handleConfirmAction = () => {
    if (!selectedAction) return;

    const requiresComment = COMMENT_REQUIRED_ACTIONS.includes(selectedAction);
    if (requiresComment && !comment.trim()) {
      toast.error('Bu işlem için açıklama gereklidir');
      return;
    }

    actionMutation.mutate({
      action: selectedAction,
      comment: comment.trim() || undefined,
      priority,
    });
  };

  if (isLoadingActions) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Aksiyonlar yükleniyor...</span>
      </div>
    );
  }

  if (availableActions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Bu aşamada yapılabilecek işlem bulunmuyor.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current Stage */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Mevcut Durum:</span>
        <Badge variant="secondary" className={STAGE_LABELS[currentStage].color}>
          {STAGE_LABELS[currentStage].label}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {availableActions.map((actionItem) => {
          const isDestructive = DESTRUCTIVE_ACTIONS.includes(actionItem.action);

          return (
            <Button
              key={actionItem.action}
              variant={isDestructive ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => handleActionClick(actionItem.action)}
              disabled={actionMutation.isPending}
            >
              {ACTION_ICONS[actionItem.action]}
              <span className="ml-2">{actionItem.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction && ACTION_LABELS[selectedAction].label}
            </DialogTitle>
            <DialogDescription>
              {selectedAction && DESTRUCTIVE_ACTIONS.includes(selectedAction)
                ? 'Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?'
                : 'İşlemi onaylamak için açıklama ekleyebilirsiniz.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">
                Açıklama
                {selectedAction && COMMENT_REQUIRED_ACTIONS.includes(selectedAction) && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Açıklama yazın..."
                rows={3}
              />
            </div>

            {/* Priority (for approve/start_distribution) */}
            {selectedAction && [WorkflowAction.APPROVE, WorkflowAction.START_DISTRIBUTION].includes(selectedAction) && (
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                    <SelectItem value="urgent">Acil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant={selectedAction && DESTRUCTIVE_ACTIONS.includes(selectedAction) ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                'Onayla'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
