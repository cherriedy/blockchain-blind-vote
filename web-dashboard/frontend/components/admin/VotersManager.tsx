'use client';

import { useEffect, useState } from 'react';
import { Voter, VoterFormData } from '@/lib/types/admin';
import { adminService } from '@/lib/api';

export default function VotersManager({ onError }: any) {
    const [voters, setVoters] = useState<Voter[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    const fetchVoters = async () => {
        setLoading(true);
        try {
            const res = await adminService.getVoters();
            setVoters(res.data);
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi tải cử tri');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVoters();
    }, []);

    const [form, setForm] = useState<VoterFormData>({
        studentId: '',
        walletAddress: '',
        name: '',
    });

    const handleCreate = async () => {
        if (!form.studentId.trim() || !form.walletAddress.trim()) {
            alert('Vui lòng nhập mã sinh viên và địa chỉ ví');
            return;
        }

        try {
            await adminService.createVoter({
                studentId: form.studentId,
                walletAddress: form.walletAddress,
                name: form.name,
            });
            setForm({ studentId: '', walletAddress: '', name: '' });
            setShowCreate(false);
            await fetchVoters();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi tạo cử tri');
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        // update UI
        setVoters(prev =>
            prev.map(v =>
                v.id === id ? { ...v, isActive: !isActive } : v
            )
        );

        try {
            await adminService.toggleStatusVoter(id, !isActive);
        } catch (err: any) {
            // rollback nếu fail
            setVoters(prev =>
                prev.map(v =>
                    v.id === id ? { ...v, isActive } : v
                )
            );
            onError(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa cử tri này?')) return;
        try {
            await adminService.deleteVoter(id);
            await fetchVoters();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Lỗi xóa cử tri');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Quản lý cử tri</h2>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                >
                    Thêm cử tri
                </button>
            </div>

            {showCreate && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h3 className="font-black text-slate-900 uppercase">Thêm cử tri mới</h3>
                    <input
                        type="text"
                        placeholder="Mã sinh viên"
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                        type="text"
                        placeholder="Tên cử tri"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                        type="text"
                        placeholder="Địa chỉ ví (0x...)"
                        value={form.walletAddress}
                        onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all"
                        >
                            Thêm
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-all"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-2xl overflow-hidden shadow-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4 text-left">Mã SV</th>
                                    <th className="px-6 py-4 text-left">Tên cử tri</th>
                                    <th className="px-6 py-4 text-left">Địa chỉ ví</th>
                                    <th className="px-6 py-4 text-left">Trạng thái</th>
                                    <th className="px-6 py-4 text-left">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voters.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                                            Chưa có cử tri nào
                                        </td>
                                    </tr>
                                ) : (
                                    voters.map((voter) => (
                                        <tr key={voter.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{voter.studentId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{voter.name}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{voter.walletAddress.slice(0, 10)}...{voter.walletAddress.slice(-8)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-bold border rounded ${voter.isActive
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {voter.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleToggleStatus(voter.id, voter.isActive)}
                                                    className={`px-2 py-1 text-xs font-bold rounded transition-all ${voter.isActive
                                                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {voter.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(voter.id)}
                                                    className="px-2 py-1 text-red-600 text-xs font-bold rounded hover:bg-red-100 transition-all"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
