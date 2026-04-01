'use client';

import { Election, Poll, Voter, Candidate } from '@/lib/types/admin';

interface OverviewTabProps {
  elections: Election[];
  polls: Poll[];
  voters: Voter[];
  candidates: Candidate[];
}

export default function OverviewTab({ elections, polls, voters, candidates }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cuộc bầu cử</div>
        <div className="text-3xl font-black text-slate-900 mb-2">{elections.length}</div>
        <div className="text-xs text-slate-500">
          {elections.filter((e) => e.status === 'active').length} đang diễn ra
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Khảo sát</div>
        <div className="text-3xl font-black text-slate-900 mb-2">{polls.length}</div>
        <div className="text-xs text-slate-500">
          {polls.filter((p) => p.status === 'active').length} đang diễn ra
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cử tri</div>
        <div className="text-3xl font-black text-slate-900 mb-2">{voters.length}</div>
        <div className="text-xs text-slate-500">
          {voters.filter((v) => v.isActive).length} hoạt động
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ứng viên</div>
        <div className="text-3xl font-black text-slate-900 mb-2">{candidates.length}</div>
        <div className="text-xs text-slate-500">Tổng cộng</div>
      </div>
    </div>
  );
}
