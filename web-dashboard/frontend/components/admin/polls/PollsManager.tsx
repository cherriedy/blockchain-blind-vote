'use client';

import { useEffect, useState } from 'react';
import {
  Admin,
  AdminRole,
  EventStatus,
  ManagerProps,
  Poll,
  PollFormData,
  Voter,
} from '@/lib/types/admin';
import PollFormModal from './PollFormModal';
import { adminService } from '@/services/admin.service';
import { useSnackbar } from '@/components/core/SnackbarContext';

type PollSubmitData = PollFormData & {
  addedAdmins?: Admin[];
  removedAdminIds?: string[];
  addedVoters?: Voter[];
  removedVoterIds?: string[];
};

export default function PollsManager({ role }: ManagerProps) {
  const { showMessage } = useSnackbar();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [search, setSearch] = useState('');

  const fetchPolls = async (q?: string) => {
    setLoading(true);
    try {
      const res = await adminService.getPolls(q);
      setPolls(res.data);
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleSubmit = async (data: PollSubmitData) => {
    try {
      const payload: any = {
        name: data.name,
        description: data.description,
        visibility: data.visibility,
        question: data.question,
        options: data.options,
      };

      if (data.isAutomatic) {
        payload.isAutomatic = true;
        payload.startAt = new Date(data.startAt).getTime();
        payload.endAt = new Date(data.endAt).getTime();
      }

      if (!editingPoll) {
        const res = await adminService.createPoll(payload);
        const pollId = res.data.id;

        if (data.addedAdmins?.length) {
          await adminService.assignAdminToPoll(pollId, {
            adminIds: data.addedAdmins.map((a: any) => a.id),
          });
        }
      } else {
        const pollId = editingPoll.id;

        await adminService.updatePoll(pollId, payload);

        if (data.removedAdminIds?.length) {
          for (const id of data.removedAdminIds) {
            await adminService.removeAdminFromPoll(pollId, id);
          }
        }

        if (data.addedAdmins?.length) {
          await adminService.assignAdminToPoll(pollId, {
            adminIds: data.addedAdmins.map((a: any) => a.id),
          });
        }

        if (data.removedVoterIds?.length) {
          for (const id of data.removedVoterIds) {
            await adminService.removeVoterFromPoll(pollId, id);
          }
        }

        if (data.addedVoters?.length) {
          await adminService.assignVoterToPoll(pollId, {
            voterIds: data.addedVoters.map((v) => v.id),
          });
        }
      }

      showMessage('Cập nhật thành công.', 'success');
      setOpenModal(false);
      setEditingPoll(null);
      fetchPolls();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa poll này?')) return;
    try {
      await adminService.deletePoll(id);
      showMessage('Xóa thành công.', 'success');
      fetchPolls();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    const colors = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-slate-50 text-slate-700 border-slate-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels = {
      pending: 'Chưa bắt đầu',
      active: 'Đang diễn ra',
      completed: 'Đã kết thúc',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchPolls(search);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black uppercase tracking-tight">Quản lý khảo sát</h2>

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
          Tìm kiếm
        </button>
      </form>

      {role === 'SUPER_ADMIN' && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditingPoll(null);
              setOpenModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
          >
            Tạo poll
          </button>
        </div>
      )}

      <PollFormModal
        role={role}
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
        initialData={editingPoll}
        mode={editingPoll ? 'edit' : 'create'}
      />
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Đang tải...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {polls.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8">Chưa có poll nào</p>
          ) : (
            polls.map((poll) => (
              <div
                key={poll.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight mb-2">
                      {poll.name}
                    </h3>

                    {poll.description && (
                      <p className="text-sm text-slate-600 mb-2">{poll.description}</p>
                    )}

                    <p className="text-sm font-medium text-blue-600 mb-3">{poll.question}</p>

                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(poll.status)}

                      <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded">
                        {poll.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                      </span>

                      {poll.isAutomatic && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded">
                          Tự động
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {poll.options.map((opt, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {opt}
                    </span>
                  ))}
                </div>

                {/* ACTION */}
                <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingPoll(poll);
                      setOpenModal(true);
                    }}
                    className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold"
                  >
                    Sửa
                  </button>

                  {role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDelete(poll.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
