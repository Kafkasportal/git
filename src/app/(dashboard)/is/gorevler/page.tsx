'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  CheckSquare,
  Play,
  CheckCircle,
  XCircle as _XCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const TaskForm = dynamic(
  () => import('@/components/forms/TaskForm').then((mod) => ({ default: mod.TaskForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    ),
    ssr: false,
  }
);
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { toast } from 'sonner';
import {
  getPriorityColor,
  getStatusColor,
  getPriorityLabel,
  getStatusLabel,
  isTaskOverdue,
  isTaskDueSoon,
} from '@/lib/validations/task';
import type { TaskDocument, UserDocument } from '@/types/database';

type ViewMode = 'kanban' | 'list';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';

export default function TasksPage() {
  const queryClient = useQueryClient();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDocument | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const limit = 20;

  // Data fetching
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', page, search, statusFilter, priorityFilter, assignedFilter],
    queryFn: () =>
      api.tasks.getTasks({
        page,
        limit,
        search,
        filters: {
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(priorityFilter !== 'all' && { priority: priorityFilter }),
          ...(assignedFilter !== 'all' && { assigned_to: assignedFilter }),
        },
      }),
  });

  // Fetch users for assigned filter
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getUsers({ limit: 100 }),
  });

  const tasks = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const users = usersResponse?.data || [];

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  // Task move mutation (for kanban drag-drop)
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskDocument['status'] }) =>
      api.tasks.updateTaskStatus(taskId, newStatus),
    onSuccess: () => {
      toast.success('Görev durumu güncellendi');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Görev durumu güncellenirken hata oluştu: ${message}`);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.tasks.deleteTask(taskId),
    onSuccess: () => {
      toast.success('Görev silindi');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Görev silinirken hata oluştu: ${message}`);
    },
  });

  // Event handlers
  const handleTaskMove = (taskId: string, newStatus: TaskDocument['status']) => {
    moveTaskMutation.mutate({ taskId, newStatus });
  };

  const handleTaskClick = (task: TaskDocument) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedFilter('all');
    setPage(1);
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: UserDocument) => u._id === userId);
    return user?.name || 'Bilinmeyen Kullanıcı';
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Hata oluştu</p>
            </div>
            <p className="text-red-600 mt-2">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Görev Yönetimi</h1>
          <p className="text-muted-foreground mt-2">Görevleri görüntüleyin, atayın ve takip edin</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>

          {/* Create Task Button */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yeni Görev
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Görev Oluştur</DialogTitle>
              </DialogHeader>
              <TaskForm
                onSuccess={() => {
                  setShowCreateModal(false);
                  // Refresh tasks list
                  queryClient.invalidateQueries({ queryKey: ['tasks'] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
                }}
                onCancel={() => setShowCreateModal(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beklemede</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Ediyor</CardTitle>
            <Play className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlandı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Görev başlığı ile ara"
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value as PriorityFilter);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
              </SelectContent>
            </Select>

            {/* Assigned Filter */}
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Atanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="unassigned">Atanmamış</SelectItem>
                {users && users.length > 0 ? (
                  users.map((user: UserDocument) => (
                    <SelectItem key={user._id || user.$id || ''} value={user._id || user.$id || ''}>
                      {user.name || 'İsimsiz Kullanıcı'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-users" disabled>
                    Kullanıcı bulunamadı
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-muted-foreground">Görevler yükleniyor...</span>
            </div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">Görev bulunamadı</p>
              <p className="text-sm mt-2">
                {search ||
                statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                assignedFilter !== 'all'
                  ? 'Arama kriterlerinize uygun görev bulunamadı'
                  : 'Henüz görev eklenmemiş'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <Card>
          <CardHeader>
            <CardTitle>Kanban Görünümü</CardTitle>
            <CardDescription>Görevleri sürükleyip bırakarak durumlarını değiştirin</CardDescription>
          </CardHeader>
          <CardContent>
            <KanbanBoard tasks={tasks} onTaskMove={handleTaskMove} onTaskClick={handleTaskClick} />
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Liste Görünümü</CardTitle>
            <CardDescription>Toplam {total} görev kaydı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => {
                const isOverdue = task.due_date ? isTaskOverdue(task.due_date) : false;
                const isDueSoon = task.due_date ? isTaskDueSoon(task.due_date) : false;

                return (
                  <div
                    key={task._id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      handleTaskClick(task);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Atanan:</span>
                            <span className="font-medium">
                              {task.assigned_to ? getUserName(task.assigned_to) : 'Atanmamış'}
                            </span>
                          </div>

                          {task.due_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Son Tarih:</span>
                              <span
                                className={`font-medium ${
                                  isOverdue
                                    ? 'text-red-600'
                                    : isDueSoon
                                      ? 'text-orange-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {new Date(task.due_date).toLocaleDateString('tr-TR')}
                              </span>
                              {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {isDueSoon && !isOverdue && (
                                <Clock className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}

                          <div>
                            <span className="text-muted-foreground">Kategori:</span>
                            <span className="font-medium ml-1">{task.category || '-'}</span>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Oluşturulma:</span>
                            <span className="font-medium ml-1">
                              {task._creationTime ? new Date(task._creationTime).toLocaleDateString('tr-TR') : task.$createdAt ? new Date(task.$createdAt).toLocaleDateString('tr-TR') : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task._id || task.$id || '');
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Sayfa {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {selectedTask && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Görevi Düzenle</DialogTitle>
            </DialogHeader>
            <TaskForm
              taskId={selectedTask._id}
              initialData={{
                title: selectedTask.title,
                description: selectedTask.description,
                assigned_to: selectedTask.assigned_to,
                priority: selectedTask.priority,
                status: selectedTask.status,
                due_date: selectedTask.due_date,
                category: selectedTask.category,
                tags: selectedTask.tags,
                completed_at: selectedTask.completed_at,
              }}
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedTask(null);
                // Refresh tasks list
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedTask(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
