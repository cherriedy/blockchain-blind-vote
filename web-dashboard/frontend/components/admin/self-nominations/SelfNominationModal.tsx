'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelfNominationFilterStatus } from '@/lib/types/admin';
import { useSnackbar } from '@/components/core/SnackbarContext';

export default function SelfNominationModal({ electionId }: { electionId: string }) {
  const { showMessage } = useSnackbar();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SelfNominationFilterStatus>('ALL');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'request'>('reject');
  const [note, setNote] = useState('');

  const fetchData = async (status?: SelfNominationFilterStatus) => {
    setLoading(true);
    try {
      const res = await adminService.getSelfNominees(electionId, status);
      setData(res.data);
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response?.data?.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(statusFilter);
  }, [electionId, statusFilter]);

  // ================= ACTION =================
  const approve = async (candidateId: string) => {
    await adminService.approveSelfNominee(electionId, candidateId);
    showMessage('Cập nhật thành công.', 'success');
    fetchData();
  };

  const handleSubmitFromDialog = async () => {
    if (!selectedCandidateId) return;

    if (!note.trim()) {
      alert('Vui lòng nhập ghi chú');
      return;
    }

    try {
      if (actionType === 'reject') {
        await adminService.rejectSelfNominee(electionId, selectedCandidateId, note);
      } else {
        await adminService.requestInfoSelfNominee(electionId, selectedCandidateId, note);
      }
      showMessage('Cập nhật thành công.', 'success');
      setOpenDialog(false);
      setNote('');
      setSelectedCandidateId(null);

      fetchData();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra');
    }
  };

  const statusColor: Record<SelfNominationFilterStatus, string> = {
    ALL: 'bg-gray-100',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    REQUEST_INFO: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-4">
      {/* ===== FILTER (CHỈ 1 LẦN) ===== */}
      <div className="flex justify-between pt-6 pb-4">
        <h3 className="font-bold">Danh sách ứng cử</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SelfNominationFilterStatus)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="ALL">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Bị từ chối</option>
          <option value="REQUEST_INFO">Yêu cầu bổ sung</option>
        </select>
      </div>

      {/* ===== LIST ===== */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              {/* ===== HEADER ===== */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {item.candidate.avatarUrl && (
                  <img
                    src={
                      item.candidate.avatarUrl.startsWith('http')
                        ? item.candidate.avatarUrl
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL}${item.candidate.avatarUrl}`
                    }
                    alt={item.candidate.name}
                    className="w-32 h-32 rounded-xl object-cover border"
                  />
                )}

                {/* Info */}
                <div className="flex-1">
                  <p className="font-semibold text-base leading-tight">{item.candidate?.name}</p>
                  <p className="text-xs text-gray-500">MSSV: {item.candidate?.studentId}</p>
                </div>

                {/* Status */}
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusColor[item.status as SelfNominationFilterStatus]}`}
                >
                  {item.status}
                </span>
              </div>

              {/* ===== INFO ===== */}
              <div className="text-sm space-y-1">
                <p>
                  <b>Cuộc bầu cử:</b> {item.election?.name}
                </p>
                <p>
                  <b>Giới thiệu:</b> {item.introduction || 'Không có'}
                </p>
                <p>
                  <b>Admin xử lý:</b> {item.admin?.name || 'Chưa xử lý'}
                </p>

                {item.adminNotes && (
                  <p className="text-red-500">
                    <b>Ghi chú:</b> {item.adminNotes}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  Tạo: {new Date(item.createdAt).toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-gray-400">
                  Update: {new Date(item.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* ===== ACTION ===== */}
              {item.status === 'PENDING' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => approve(item.candidateId)}>
                    Duyệt
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedCandidateId(item.candidateId);
                      setActionType('reject');
                      setOpenDialog(true);
                    }}
                  >
                    Từ chối
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedCandidateId(item.candidateId);
                      setActionType('request');
                      setOpenDialog(true);
                    }}
                  >
                    Yêu cầu bổ sung
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODAL NOTE ===== */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'reject' ? 'Từ chối ứng viên' : 'Yêu cầu bổ sung'}
            </DialogTitle>
          </DialogHeader>

          <textarea
            placeholder="Nhập ghi chú..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Hủy
            </Button>

            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={handleSubmitFromDialog}
            >
              Xác nhận
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
