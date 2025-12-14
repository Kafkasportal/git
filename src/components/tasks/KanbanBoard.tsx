'use client';

import React, { useState, useCallback, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, AlertCircle, Clock, GripVertical } from 'lucide-react';
import type { TaskDocument } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  getPriorityColor,
  getPriorityLabel,
  isTaskOverdue,
  isTaskDueSoon,
} from '@/lib/validations/task';

interface KanbanBoardProps {
  tasks: TaskDocument[];
  onTaskMove: (taskId: string, newStatus: TaskDocument['status']) => void;
  onTaskClick: (task: TaskDocument) => void;
}

interface KanbanColumnProps {
  title: string;
  status: TaskDocument['status'];
  tasks: TaskDocument[];
  onTaskMove: (taskId: string, newStatus: TaskDocument['status']) => void;
  onTaskClick: (task: TaskDocument) => void;
  colorConfig: {
    header: string;
    badge: string;
    dropZone: string;
  };
}

interface TaskCardProps {
  task: TaskDocument;
  onTaskClick: (task: TaskDocument) => void;
}

const COLUMNS = [
  {
    status: 'pending' as const,
    title: 'Beklemede',
    colorConfig: {
      header: 'bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      dropZone: 'border-amber-400 bg-amber-50 dark:bg-amber-500/10',
    },
  },
  {
    status: 'in_progress' as const,
    title: 'Devam Ediyor',
    colorConfig: {
      header: 'bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      dropZone: 'border-blue-400 bg-blue-50 dark:bg-blue-500/10',
    },
  },
  {
    status: 'completed' as const,
    title: 'Tamamlandı',
    colorConfig: {
      header: 'bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      dropZone: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    },
  },
  {
    status: 'cancelled' as const,
    title: 'İptal',
    colorConfig: {
      header: 'bg-slate-50 dark:bg-slate-500/10 border-b border-slate-200 dark:border-slate-500/20',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
      dropZone: 'border-slate-400 bg-slate-50 dark:bg-slate-500/10',
    },
  },
];

const TaskCard = memo(({ task, onTaskClick }: TaskCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);
      e.dataTransfer.setData('text/plain', task._id || task.$id || '');
      e.dataTransfer.effectAllowed = 'move';
    },
    [task._id, task.$id]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    onTaskClick(task);
  }, [onTaskClick, task]);

  const isOverdue = task.due_date ? isTaskOverdue(task.due_date) : false;
  const isDueSoon = task.due_date ? isTaskDueSoon(task.due_date) : false;

  return (
    <div
      className={cn(
        'group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700',
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
        isDragging && 'opacity-50 scale-95 rotate-2'
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className="p-3">
        {/* Drag Handle + Title */}
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          <h3 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-2 flex-1">
            {task.title}
          </h3>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 ml-6">
            {task.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="space-y-2 ml-6">
          {/* Assigned User */}
          {task.assigned_to && (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <User className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {task.assigned_to}
              </span>
            </div>
          )}

          {/* Due Date */}
          {task.due_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className={cn(
                'h-3.5 w-3.5',
                isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : 'text-slate-400'
              )} />
              <span className={cn(
                'text-xs',
                isOverdue ? 'text-red-600 dark:text-red-400 font-medium' :
                  isDueSoon ? 'text-amber-600 dark:text-amber-400 font-medium' :
                    'text-slate-500 dark:text-slate-400'
              )}>
                {new Date(task.due_date).toLocaleDateString('tr-TR')}
              </span>
              {isOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
              {isDueSoon && !isOverdue && <Clock className="h-3 w-3 text-amber-500" />}
            </div>
          )}
        </div>

        {/* Footer: Priority + Tags */}
        <div className="flex items-center justify-between mt-3 ml-6">
          <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
            {getPriorityLabel(task.priority)}
          </Badge>

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-[10px] text-slate-400">+{task.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

const KanbanColumn = memo(
  ({ title, status, tasks, onTaskMove, onTaskClick, colorConfig }: KanbanColumnProps) => {
    const [dragOver, setDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
      setDragOver(false);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
          onTaskMove(taskId, status);
        }
      },
      [onTaskMove, status]
    );

    const columnTasks = tasks.filter((task) => task.status === status);

    return (
      <div className="flex flex-col min-w-[280px] w-[280px] lg:w-full lg:min-w-0">
        {/* Column Header */}
        <div className={cn('px-3 py-2.5 rounded-t-lg', colorConfig.header)}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</span>
            <Badge className={cn('text-xs font-medium', colorConfig.badge)}>
              {columnTasks.length}
            </Badge>
          </div>
        </div>

        {/* Column Content */}
        <div
          className={cn(
            'flex-1 p-2 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-lg min-h-[400px] transition-all duration-200',
            dragOver && `border-2 border-dashed ${colorConfig.dropZone} rounded-lg`
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            {columnTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-500">
                <div className="text-sm">Görev yok</div>
                <div className="text-xs mt-1">Sürükleyip bırakın</div>
              </div>
            ) : (
              columnTasks.map((task) => (
                <TaskCard key={task._id || task.$id} task={task} onTaskClick={onTaskClick} />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

KanbanColumn.displayName = 'KanbanColumn';

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  return (
    <div className="relative">
      {/* Kanban Container */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={tasks}
            onTaskMove={onTaskMove}
            onTaskClick={onTaskClick}
            colorConfig={column.colorConfig}
          />
        ))}
      </div>
    </div>
  );
}
