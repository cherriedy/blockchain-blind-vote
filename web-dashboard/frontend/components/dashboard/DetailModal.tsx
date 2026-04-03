import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from './StatusBadge';
import CandidateList from './CandidateList';
import { formatDatetime } from '@/lib/format';
import { publicApiService } from '@/services/public.service';

export default function DetailModal({ item, type, onClose }: { item: any; type: 'election' | 'poll' | null; onClose: () => void }) {
    const router = useRouter();
    const [candidates, setCandidates] = useState({ assigned: [], selfNominated: [] });
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [candidatesError, setCandidatesError] = useState('');
    const [showSelfNominateModal, setShowSelfNominateModal] = useState(false);
    const [intro, setIntro] = useState('');

    const isElection = type === 'election';

    useEffect(() => {
        if (!item || !isElection) return;

        let isMounted = true;
        const fetchCandidates = async () => {
            if (isMounted) setCandidatesLoading(true);
            try {
                const res = await publicApiService.getElectionCandidates(item.id);
                if (isMounted) {
                    setCandidates(res.data ?? { assigned: [], selfNominated: [] });
                    setCandidatesError('');
                    setCandidatesLoading(false);
                }
            } catch {
                if (isMounted) {
                    setCandidatesError('Không thể tải danh sách ứng viên.');
                    setCandidates({ assigned: [], selfNominated: [] });
                    setCandidatesLoading(false);
                }
            }
        };
        fetchCandidates();
        return () => {
            isMounted = false;
        };
    }, [item, isElection]);

    if (!item) return null;

    const totalVotes = isElection
        ? Object.values(item.votes ?? {}).reduce((a: number, b: any) => a + Number(b), 0)
        : (Array.isArray(item.votes) ? item.votes.reduce((a: number, b: any) => a + Number(b), 0) : 0);


    const handleSelfNominate = async () => {
        try {
            const wallet = localStorage.getItem('walletAddress');

            const res = await publicApiService.getMyCandidate(wallet!);

            if (!res.data) {
                alert('Bạn chưa đăng ký ứng viên');
                router.push('/candidate/register');
                return;
            }
            setShowSelfNominateModal(true);

        } catch {
            alert('Lỗi kiểm tra ứng viên');
        }
    };

    const submitSelfNomination = async () => {
        try {
            const walletAddress = localStorage.getItem('walletAddress');
            const studentId = localStorage.getItem('studentId');

            if (!walletAddress || !studentId) {
                return;
            }

            await publicApiService.selfNominate(item.id, {
                walletAddress,
                studentId,
                introduction: intro,
            });

            alert('Nộp đơn thành công');
            setShowSelfNominateModal(false);

        } catch (err: any) {
            alert(err?.response?.data?.message || 'Lỗi');
        }
    };

    return (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-6xl rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-7 md:p-10 border-b border-slate-100 flex justify-between items-start ${isElection ? 'bg-blue-50/40' : 'bg-indigo-50/40'}`}>
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isElection ? 'text-blue-600' : 'text-indigo-600'}`}>
                                {isElection ? 'Bầu cử' : 'Khảo sát'}
                            </span>
                            <StatusBadge status={item.status} />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white transition-colors text-slate-400 hover:text-slate-700 shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body - Two Column Layout */}
                <div className="flex flex-col md:flex-row max-h-[70vh] overflow-hidden">
                    {/* LEFT COLUMN: Description & Dates */}
                    <div className="flex-1 p-7 md:p-10 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 space-y-5">
                        {item.description && (
                            <p className="text-sm text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl italic border-l-4 border-slate-200">
                                {item.description}
                            </p>
                        )}

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bắt đầu</p>
                                <p className="text-sm font-black text-slate-700">{item.startAt ? formatDatetime(item.startAt) : '—'}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kết thúc</p>
                                <p className="text-sm font-black text-slate-700">{item.endAt ? formatDatetime(item.endAt) : '—'}</p>
                            </div>
                        </div>

                        {/* Poll question */}
                        {!isElection && item.question && (
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Câu hỏi</p>
                                <p className="text-base font-bold text-slate-700 italic bg-indigo-50 p-4 rounded-xl">{item.question}</p>
                            </div>
                        )}

                        {isElection && item.status === 'pending' && item.allowSelfNomination && (
                            <button
                                onClick={handleSelfNominate}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold"
                            >
                                Tự ứng cử
                            </button>
                        )}

                        {showSelfNominateModal && (
                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                                <div className="bg-white p-6 rounded-xl w-96">
                                    <h3 className="font-bold mb-3">Giới thiệu bản thân</h3>

                                    <textarea
                                        value={intro}
                                        onChange={(e) => setIntro(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />

                                    <button
                                        onClick={submitSelfNomination}
                                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        Nộp đơn
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Candidates/Options & Stats */}
                    <div className="flex-1 p-7 md:p-10 overflow-y-auto space-y-5">
                        {/* Candidates (elections only) */}
                        {isElection && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ứng viên</p>
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {(candidates.assigned?.length ?? 0) + (candidates.selfNominated?.length ?? 0)} tổng
                                        </span>
                                    </div>
                                    {totalVotes > 0 && (
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {totalVotes.toLocaleString()} phiếu
                                        </span>
                                    )}
                                </div>
                                <CandidateList
                                    assigned={candidates.assigned ?? []}
                                    selfNominated={candidates.selfNominated ?? []}
                                    votes={item.votes ?? {}}
                                    loading={candidatesLoading}
                                    error={candidatesError}
                                />
                            </div>
                        )}

                        {/* Poll options + results */}
                        {!isElection && item.options && item.options.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kết quả phương án</p>
                                    {totalVotes > 0 && (
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            {totalVotes.toLocaleString()} phiếu
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {item.options.map((opt: any, i: number) => {
                                        const count = item.votes?.[i] ?? 0;
                                        const pct = totalVotes > 0 ? Math.round((Number(count) / totalVotes) * 100) : 0;
                                        return (
                                            <div key={i} className="p-3 bg-slate-50 rounded-xl">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <p className="text-xs font-black text-slate-700 uppercase">{opt}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900">{Number(count).toLocaleString()}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tổng phiếu</p>
                                <p className="text-lg font-black text-slate-900">{totalVotes.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Chế độ</p>
                                <p className="text-sm font-black text-slate-700">{item.isAutomatic ? 'Tự động' : 'Thủ công'}</p>
                            </div>
                        </div>
                    </div>
                </div>{/* ← closes Body */}

                {/* Footer */}
                <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic truncate">
                        {isElection ? 'Cuộc bầu cử' : 'Khảo sát'} · ID: {item.id}
                    </p>
                    {item.status === 'active' && (
                        <button
                            onClick={() => {
                                onClose();
                                router.push(`/vote?voteType=${isElection ? 'election' : 'poll'}&voteId=${item.id}`);
                            }}
                            className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${isElection
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20'
                                }`}
                        >
                            Bỏ phiếu ngay →
                        </button>
                    )}
                </div>
            </div>{/* ← closes inner modal */}
        </div>
    );
}
