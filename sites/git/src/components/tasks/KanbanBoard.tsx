'use client';

import React, { useState, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, AlertCircle, Clock } from 'lucide-react';
import type { TaskDocument } from '@/types/database';
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
  color: string;
}

interface TaskCardProps {
  task: TaskDocument;
  onTaskClick: (task: TaskDocument) => void;
}

const COLUMNS = [
  {
    status: 'pending' as const,
    title: 'Beklemede',
    color: 'border-yellow-200 bg-yellow-50',
  },
  {
    status: 'in_progress' as const,
    title: 'Devam Ediyor',
    color: 'border-blue-200 bg-blue-50',
  },
  {
    status: 'completed' as const,
    title: 'Tamamlandı',
    color: 'border-green-200 bg-green-50',
  },
  {
    status: 'cancelled' as const,
    title: 'İptal Edildi',
    color: 'border-gray-200 bg-gray-50',
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
    <Card
      className={`cursor-move transition-all duration-200 hover:shadow-md hover:bg-muted/30 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{task.title}</h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Assigned User */}
        {task.assigned_to && (
          <div className="flex items-center gap-1 mb-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {task.assigned_to} {/* In real app, this would be user name */}
            </span>
          </div>
        )}

        {/* Priority Badge */}
        <div className="mb-2">
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center gap-1 mb-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span
              className={`text-xs ${
                isOverdue
                  ? 'text-destructive font-medium'
                  : isDueSoon
                    ? 'text-warning font-medium'
                    : 'text-muted-foreground'
              }`}
            >
              {new Date(task.due_date).toLocaleDateString('tr-TR')}
            </span>
            {isOverdue && <AlertCircle className="h-3 w-3 text-destructive" />}
            {isDueSoon && !isOverdue && <Clock className="h-3 w-3 text-warning" />}
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{task.tags.length - 3} daha
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TaskCard.displayName = 'TaskCard';

const KanbanColumn = memo(
  ({ title, status, tasks, onTaskMove, onTaskClick, color }: KanbanColumnProps) => {
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
      <div className="flex flex-col h-full">
        {/* Column Header */}
        <CardHeader className={`pb-3 ${color}`}>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary" className="text-xs">
              {columnTasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        {/* Column Content */}
        <CardContent className={`flex-1 p-3 ${color} min-h-[400px]`}>
          <div
            className={`space-y-3 h-full transition-colors duration-200 ${
              dragOver ? 'border-2 border-dashed border-blue-500 bg-blue-100 rounded-lg p-2' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {columnTasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                Bu sütunda görev yok
              </div>
            ) : (
              columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} onTaskClick={onTaskClick} />
              ))
            )}
          </div>
        </CardContent>
      </div>
    );
  }
);

KanbanColumn.displayName = 'KanbanColumn';

export function KanbanBoard({ tasks, onTaskMove, onTaskClick }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {COLUMNS.map((column) => (
        <Card key={column.status} className="flex flex-col h-full">
          <KanbanColumn
            title={column.title}
            status={column.status}
            tasks={tasks}
            onTaskMove={onTaskMove}
            onTaskClick={onTaskClick}
            color={column.color}
          />
        </Card>
      ))}
    </div>
  );
}
