'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ManagerProps, SelfNomination, SelfNominationFilterStatus } from '@/lib/types/admin';
import SelfNominationModal from './SelfNominationModal';
import { useSnackbar } from '@/components/core/SnackbarContext';

export default function SelfNominationManager({ role }: ManagerProps) {
  const { showMessage } = useSnackbar();
  const [data, setData] = useState<SelfNomination[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SelfNominationFilterStatus>('ALL');
  const [search, setSearch] = useState('');

  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchAll = async (status?: SelfNominationFilterStatus, q?: string) => {
    setLoading(true);
    try {
      const res = await adminService.getAllSelfNominees(status, q);
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
    fetchAll(statusFilter, search);
  }, [statusFilter]);

  const statusColor: Record<SelfNominationFilterStatus, string> = {
    ALL: 'bg-gray-100',
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    REQUEST_INFO: 'bg-orange-100 text-orange-700',
  };

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchAll(statusFilter, search);
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}

      <h2 className="text-xl font-bold">Quản lý tự ứng cử</h2>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="mb-6 flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, target, or admin..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 transition-all duration-200"
          />

          {/* Icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.3-4.3M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-medium text-white rounded-xl
               bg-gradient-to-r from-blue-500 to-blue-600
               hover:from-blue-600 hover:to-blue-700
               shadow-sm hover:shadow-md
               transition-all duration-200 active:scale-95"
        >
          Search
        </button>
      </form>

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

      {/* LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => {
                setSelectedElectionId(item.electionId);
                setOpen(true);
              }}
            >
              <CardContent className="flex justify-between p-3">
                {/* LEFT */}
                <div>
                  <p className="font-semibold">{item.candidate?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.election?.name}</p>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded ${statusColor[item.status as SelfNominationFilterStatus]}`}
                  >
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-4">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODAL ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className="max-w-4xl">
          {selectedElectionId && <SelfNominationModal electionId={selectedElectionId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
