import StatusBadge from './StatusBadge';
import { formatDate } from '@/utilities/format';

export default function PollCard({ poll, onClick }) {
    const totalVotes = Array.isArray(poll.votes)
        ? poll.votes.reduce((a, b) => a + Number(b), 0)
        : 0;

    return (
        <div
            onClick={() => onClick(poll)}
            className="group bg-white border border-slate-100 hover:border-indigo-500 rounded-3xl p-7 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/2 group-hover:to-purple-600/3 transition-all duration-500"></div>
            <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <StatusBadge status={poll.status} />
                </div>

                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                    {poll.name}
                </h3>

                {poll.question && (
                    <p className="text-sm text-slate-500 font-semibold italic leading-relaxed mb-3 border-l-2 border-indigo-200 pl-3">
                        {poll.question}
                    </p>
                )}

                {poll.description && !poll.question && (
                    <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2 mb-4">
                        {poll.description}
                    </p>
                )}

                {poll.options && poll.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {poll.options.slice(0, 3).map((opt, i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wide rounded-lg border border-slate-100">
                                {opt}
                            </span>
                        ))}
                        {poll.options.length > 3 && (
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100">
                                +{poll.options.length - 3}
                            </span>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {totalVotes.toLocaleString()} phiếu
                        </span>
                    </div>
                    {poll.endAt && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] font-bold text-slate-400">Hết: {formatDate(poll.endAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

