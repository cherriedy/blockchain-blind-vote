'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import {
  Admin,
  AdminRole,
  Election,
  ElectionFormData,
  EventVisibility,
  Voter,
} from '@/lib/types/admin';
import AdminManagerSection from '../sections/AdminManagerSection';
import VoterManagerSection from '../sections/VoterManagerSection';
import CandidateManagerSection from '../sections/CandidateManagerSection';

interface ElectionFormModalProps {
  role: AdminRole;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Election | null;
  mode: 'create' | 'edit';
}

export default function ElectionFormModal({
  role,
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ElectionFormModalProps) {
  const [selectedAdmins, setSelectedAdmins] = useState<Admin[]>([]);
  const [removedAdminIds, setRemovedAdminIds] = useState<string[]>([]);

  const [selectedVoters, setSelectedVoters] = useState<Voter[]>([]);
  const [removedVoterIds, setRemovedVoterIds] = useState<string[]>([]);

  const [form, setForm] = useState<ElectionFormData>({
    name: '',
    description: '',
    visibility: 'public',
    isAutomatic: false,
    startAt: '',
    endAt: '',
    allowSelfNomination: false,
    voterListFinalized: false,
    candidateIds: [] as string[],
  });

  useEffect(() => {
    if (open) {
      // reset danh sách local
      setSelectedAdmins([]);
      setRemovedAdminIds([]);

      setSelectedVoters([]);
      setRemovedVoterIds([]);

      if (initialData) {
        setForm({
          name: initialData.name,
          description: initialData.description || '',
          visibility: initialData.visibility,
          isAutomatic: initialData.isAutomatic,
          startAt: initialData.startAt
            ? new Date(initialData.startAt).toISOString().slice(0, 16)
            : '',
          endAt: initialData.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : '',
          allowSelfNomination: initialData.allowSelfNomination,
          voterListFinalized: initialData.voterListFinalized,
          candidateIds: initialData.candidateIds || [],
        });
      } else {
        setForm({
          name: '',
          description: '',
          visibility: 'public',
          isAutomatic: false,
          startAt: '',
          endAt: '',
          allowSelfNomination: false,
          voterListFinalized: false,
          candidateIds: [],
        });
      }
    }
  }, [open, initialData]);

  const handleLocalSubmit = () => {
    onSubmit({
      ...form,
      addedAdmins: selectedAdmins,
      removedAdminIds,
      addedVoters: selectedVoters,
      removedVoterIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b text-center">
          <DialogTitle className="text-lg font-semibold">
            {mode === 'create' ? 'Tạo cuộc bầu cử' : 'Cập nhật cuộc bầu cử'}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-sm font-semibold text-slate-700">Thông tin cơ bản</p>
          {/* Thông tin cơ bản */}
          <div className="space-y-3">
            <Input
              placeholder="Tên cuộc bầu cử..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <textarea
              placeholder="Mô tả..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Chế độ</p>
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value as EventVisibility })
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Tự ứng cử</p>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={form.allowSelfNomination}
                  onChange={(e) => setForm({ ...form, allowSelfNomination: e.target.checked })}
                />
                <span className="text-sm">Cho phép tự ứng cử</span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAutomatic}
                onChange={(e) => setForm({ ...form, isAutomatic: e.target.checked })}
              />
              <span className="text-sm font-medium">Lên lịch tự động</span>
            </div>

            {form.isAutomatic && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="datetime-local"
                  value={form.startAt || ''}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={form.endAt || ''}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Admin */}
          {role === 'SUPER_ADMIN' && (
            <div className="mt-4 border-t pt-4 space-y-6">
              <AdminManagerSection
                objectId={initialData?.id}
                objectType="ELECTION"
                addedAdmins={selectedAdmins}
                setAddedAdmins={setSelectedAdmins}
                removedAdminIds={removedAdminIds}
                setRemovedAdminIds={setRemovedAdminIds}
              />
            </div>
          )}

          {/* Candidate */}
          <div className="mt-4 border-t pt-4 space-y-6">
            <CandidateManagerSection electionId={initialData?.id} form={form} setForm={setForm} />
          </div>

          {form.visibility === 'private' && (
            <div className="mt-4 border-t pt-4 space-y-6">
              <VoterManagerSection
                objectId={initialData?.id}
                objectType="ELECTION"
                addedVoters={selectedVoters}
                setAddedVoters={setSelectedVoters}
                removedVoterIds={removedVoterIds}
                setRemovedVoterIds={setRemovedVoterIds}
              />
            </div>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                checked={form.voterListFinalized}
                onChange={(e) => setForm({ ...form, voterListFinalized: e.target.checked })}
              />
              <span className="text-sm">Khóa bầu cử</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>

          <Button
            onClick={handleLocalSubmit}
            // disabled={!form.name || form.candidateIds.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {mode === 'create' ? 'Tạo' : 'Cập nhật'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
