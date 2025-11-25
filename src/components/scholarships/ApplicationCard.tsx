'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, Edit, DollarSign, Users, Calendar } from 'lucide-react';
import { ScholarshipApplication } from '@/types/scholarship';
import { getApplicationStatusBadge } from '@/lib/utils/scholarship-helpers';

interface ApplicationCardProps {
  application: ScholarshipApplication & {
    scholarship?: { name: string };
    student?: { firstName: string; lastName: string; institution?: string };
  };
  onEdit?: (application: ScholarshipApplication) => void;
}

export function ApplicationCard({ application, onEdit }: ApplicationCardProps) {
  return (
    <Card key={application.id} className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">
                {application.student?.firstName} {application.student?.lastName}
              </h3>
              {getApplicationStatusBadge(application.status)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>{application.scholarship?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{application.student?.institution}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(application.applicationDate).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Başvuru Detayları</DialogTitle>
                  <DialogDescription>
                    {application.student?.firstName} {application.student?.lastName} -{' '}
                    {application.scholarship?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Öğrenci</Label>
                      <p className="text-sm text-muted-foreground">
                        {application.student?.firstName} {application.student?.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Burs</Label>
                      <p className="text-sm text-muted-foreground">
                        {application.scholarship?.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durum</Label>
                      <div className="mt-1">{getApplicationStatusBadge(application.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Başvuru Tarihi</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(application.applicationDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  {application.personalStatement && (
                    <div>
                      <Label className="text-sm font-medium">Kişisel Beyan</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.personalStatement}
                      </p>
                    </div>
                  )}
                  {application.familySituation && (
                    <div>
                      <Label className="text-sm font-medium">Aile Durumu</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.familySituation}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(application)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
