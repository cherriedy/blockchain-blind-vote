import StatusBadge from './StatusBadge';
import { formatDate } from '@/lib/format';

interface Election {
  id: string;
  name: string;
  description?: string;
  status: string;
  votes?: Record<string, number>;
  candidateIds?: string[];
  selfNominatedCandidates?: any[];
  endAt?: number | string;
}

interface ElectionCardProps {
  election: Election;
  onClick: (election: Election) => void;
}

export default function ElectionCard({ election, onClick }: ElectionCardProps) {
  const totalVotes = election.votes
    ? Object.values(election.votes).reduce((a, b) => a + Number(b), 0)
    : 0;

  return (
    <div
      onClick={() => onClick(election)}
      className="group bg-white border border-slate-100 hover:border-blue-500 rounded-3xl p-7 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-br from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/2 group-hover:to-indigo-600/3 transition-all duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <StatusBadge status={election.status} />
        </div>

        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-2 group-hover:text-blue-600 transition-colors">
          {election.name}
        </h3>

        {election.description && (
          <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 mb-4">
            {election.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {(election.candidateIds?.length ?? 0) +
                (election.selfNominatedCandidates?.length ?? 0)}{' '}
              ứng viên
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {totalVotes.toLocaleString()} phiếu
            </span>
          </div>
          {election.endAt && (
            <div className="flex items-center gap-1.5 ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-[10px] font-bold text-slate-400">
                Hết: {formatDate(election.endAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
