'use client';

import { useEffect, useState } from 'react';
import { Candidate, CandidateFormData } from '@/lib/types/admin';
import { adminService } from '@/lib/api';;

export default function CandidatesManager({ onError }: any) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await adminService.getCandidates();
            setCandidates(res.data);
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi tải cử tri');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const [form, setForm] = useState<CandidateFormData>({
        studentId: '',
        name: '',
        bio: '',
        walletAddress: '',
    });

    const handleCreate = async () => {
        if (!form.studentId.trim() || !form.name.trim() || !form.walletAddress.trim()) {
            alert('Vui lòng nhập mã sinh viên, tên, và địa chỉ ví');
            return;
        }

        try {
            await adminService.createCandidate({
                studentId: form.studentId,
                name: form.name,
                bio: form.bio,
                walletAddress: form.walletAddress,
            });
            setForm({ studentId: '', name: '', bio: '', walletAddress: '' });
            setShowCreate(false);
            await fetchCandidates();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi tạo ứng viên');
        }
    };

    const handleUpdate = async () => {
        if (!editingCandidate) return;

        try {
            await adminService.updateCandidate(editingCandidate.id, {
                name: form.name,
                bio: form.bio,
            });

            setEditingCandidate(null);
            setForm({ studentId: '', name: '', bio: '', walletAddress: '' });

            await fetchCandidates();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi cập nhật ứng viên');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa ứng viên này?')) return;
        try {
            await adminService.deleteCandidate(id);
            await fetchCandidates();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi xóa ứng viên');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Quản lý ứng viên</h2>
                <button
                    onClick={() => {
                        setShowCreate(true);
                        setForm({
                            studentId: '',
                            name: '',
                            bio: '',
                            walletAddress: '',
                        });
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                >
                    Thêm ứng viên
                </button>
            </div>

            {(showCreate || editingCandidate) && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-black text-slate-900 uppercase">
                        {editingCandidate ? 'Cập nhật ứng viên' : 'Thêm ứng viên mới'}
                    </h3>

                    <input
                        type="text"
                        placeholder="Mã sinh viên"
                        value={form.studentId}
                        disabled={!!editingCandidate}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />

                    <input
                        type="text"
                        placeholder="Tên"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />

                    <textarea
                        placeholder="Tiểu sử"
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />

                    <input
                        type="text"
                        placeholder="Địa chỉ ví"
                        value={form.walletAddress}
                        disabled={!!editingCandidate}
                        onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={editingCandidate ? handleUpdate : handleCreate}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                            {editingCandidate ? 'Cập nhật' : 'Thêm'}
                        </button>

                        <button
                            onClick={() => {
                                setShowCreate(false);
                                setEditingCandidate(null);
                            }}
                            className="px-4 py-2 bg-slate-200 rounded-lg"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.length === 0 ? (
                    <p className="col-span-full text-center text-slate-500 italic py-8">Chưa có ứng viên nào</p>
                ) : (
                    candidates.map((candidate) => (
                        <div
                            key={candidate.id}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all"
                        >
                            {candidate.avatarUrl && (
                                <img
                                    src={candidate.avatarUrl}
                                    alt={candidate.name}
                                    className="w-full aspect-square rounded-xl mb-3 object-cover"
                                />
                            )}
                            <h3 className="font-black text-slate-900 uppercase tracking-tight mb-1">{candidate.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mb-2">{candidate.studentId}</p>
                            {candidate.bio && (
                                <p className="text-sm text-slate-600 mb-3 italic">{candidate.bio}</p>
                            )}
                            <p className="text-xs text-slate-500 font-mono mb-4">{candidate.walletAddress.slice(0, 10)}...{candidate.walletAddress.slice(-8)}</p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingCandidate(candidate);
                                        setForm({
                                            studentId: candidate.studentId,
                                            name: candidate.name,
                                            bio: candidate.bio || '',
                                            walletAddress: candidate.walletAddress,
                                        });
                                        setShowCreate(true);
                                    }}
                                    className="w-full px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                >
                                    Sửa
                                </button>

                                <button
                                    onClick={() => handleDelete(candidate.id)}
                                    className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
