'use client';

import { useEffect, useState } from 'react';
import { Candidate, CandidateFormData, ManagerProps } from '@/lib/types/admin';
import { adminService } from '@/services/admin.service';
import { useSnackbar } from '../core/SnackbarContext';

export default function CandidatesManager({ role }: ManagerProps) {
    const { showMessage } = useSnackbar();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [search, setSearch] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const fetchCandidates = async (q?: string) => {
        setLoading(true);
        try {
            const res = await adminService.getCandidates(q);
            setCandidates(res.data);
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
            const formData = new FormData();

            formData.append('studentId', form.studentId);
            formData.append('name', form.name);
            formData.append('bio', form.bio || '');
            formData.append('walletAddress', form.walletAddress);

            if (file) {
                formData.append('avatar', file);
            }

            await adminService.createCandidate(formData);

            showMessage("Tạo thành công.", 'success');

            setForm({ studentId: '', name: '', bio: '', walletAddress: '' });
            setFile(null);
            setShowCreate(false);

            await fetchCandidates();
        } catch (err: any) {
            console.error(err);
            showMessage(err?.response?.data?.message || 'Something went wrong', 'error');
        }
    };

    const handleUpdate = async () => {
        if (!editingCandidate) return;

        try {
            const formData = new FormData();

            formData.append('studentId', form.studentId);
            formData.append('name', form.name);
            formData.append('bio', form.bio || '');
            formData.append('walletAddress', form.walletAddress);

            if (file) {
                formData.append('avatar', file);
            }

            await adminService.updateCandidate(editingCandidate.id, formData);

            showMessage("Cập nhật thành công.", 'success');

            setForm({ studentId: '', name: '', bio: '', walletAddress: '' });
            setFile(null);
            setEditingCandidate(null);

            await fetchCandidates();
        } catch (err: any) {
            console.error(err);
            showMessage(err?.response?.data?.message || 'Something went wrong', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa ứng viên này?')) return;
        try {
            await adminService.deleteCandidate(id);
            showMessage("Cập nhật thành công.", 'success');

            await fetchCandidates();
        } catch (err: any) {
            console.error(err);

            if (err?.response?.data?.message) {
                showMessage(err.response.data.message, 'error');
            } else {
                showMessage('Something went wrong', 'error');
            }
        }
    };

    const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchCandidates(search);
    };

    return (
        <div className="space-y-6">

            <h2 className="text-xl font-black uppercase tracking-tight">Quản lý ứng viên</h2>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M10 18a8 8 0 100-16 8 8 0 000 16z" />
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

            <div className="flex justify-end">
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

                    {/* Avatar preview */}
                    <div className="flex flex-col items-center mb-5">
                        <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border shadow-sm mb-2">
                            {file ? (
                                <img
                                    src={
                                        file
                                            ? URL.createObjectURL(file)
                                            : editingCandidate?.avatarUrl
                                                ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${editingCandidate.avatarUrl}`
                                                : '/no-avatar.png'
                                    }
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                    No Image
                                </div>
                            )}
                        </div>

                        <label className="text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-600">
                            Chọn ảnh
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </label>
                    </div>

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

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                                    src={
                                        candidate.avatarUrl?.startsWith('http')
                                            ? candidate.avatarUrl
                                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${candidate.avatarUrl}`
                                    }
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
            )}
        </div>
    );
}
