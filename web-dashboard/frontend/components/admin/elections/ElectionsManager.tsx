'use client';

import { useEffect, useState } from 'react';
import { Admin, AdminRole, Election, ElectionFormData, EventStatus, ManagerProps, Voter } from '@/lib/types/admin';
import ElectionFormModal from './ElectionFormModal';
import { adminService } from '@/services/admin.service';
import { useSnackbar } from '@/components/core/SnackbarContext';

type ElectionSubmitData = ElectionFormData & {
    addedAdmins?: Admin[];
    removedAdminIds?: string[];
    addedVoters?: Voter[];
    removedVoterIds?: string[];
};

export default function ElectionsManager({ role }: ManagerProps) {
    const { showMessage } = useSnackbar();
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editingElection, setEditingElection] = useState<Election | null>(null);

    // ================= FETCH =================
    const fetchElections = async () => {
        setLoading(true);
        try {
            const res = await adminService.getElections();
            setElections(res.data);
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
        fetchElections();
    }, []);

    const handleOpenCreate = () => {
        setEditingElection(null);
        setOpenModal(true);
    };
    const handleEdit = (election: Election) => {
        setEditingElection(election);
        setOpenModal(true);
    };

    const handleSubmitElection = async (data: ElectionSubmitData) => {
        if (!data.name.trim()) {
            alert('Vui lòng nhập tên cuộc bầu cử');
            return;
        }

        if (data.candidateIds.length === 0) {
            alert('Phải có ít nhất 1 ứng cử viên');
            return;
        }

        try {
            const payload: any = {
                name: data.name,
                description: data.description,
                visibility: data.visibility,
                allowSelfNomination: data.allowSelfNomination,
                voterListFinalized: data.voterListFinalized,
                candidateIds: data.candidateIds,
            };

            if (data.isAutomatic) {
                if (!data.startAt || !data.endAt) {
                    alert('Thiếu thời gian');
                    return;
                }

                payload.isAutomatic = true;
                payload.startAt = new Date(data.startAt).getTime();
                payload.endAt = new Date(data.endAt).getTime();
            }

            if (!editingElection) {
                const res = await adminService.createElection(payload);
                const electionId = res.data.id;

                // bulk add admin
                if (data.addedAdmins?.length) {
                    await adminService.assignAdminToElection(electionId, {
                        adminIds: data.addedAdmins.map(a => a.id),
                    });
                }

                // bulk add voter
                if (data.addedVoters?.length) {
                    await adminService.assignVoterToElection(electionId, {
                        voterIds: data.addedVoters.map(v => v.id),
                    });
                }
            } else {
                const electionId = editingElection.id;

                await adminService.updateElection(electionId, payload);

                // ---- ADMIN ----
                if (data.removedAdminIds?.length) {
                    for (const id of data.removedAdminIds) {
                        await adminService.removeAdminFromElection(electionId, id);
                    }
                }

                if (data.addedAdmins?.length) {
                    await adminService.assignAdminToElection(electionId, {
                        adminIds: data.addedAdmins.map(a => a.id),
                    });
                }

                // ---- VOTER ----
                if (data.removedVoterIds?.length) {
                    for (const id of data.removedVoterIds) {
                        await adminService.removeVoterFromElection(electionId, id);
                    }
                }

                if (data.addedVoters?.length) {
                    await adminService.assignVoterToElection(electionId, {
                        voterIds: data.addedVoters.map(v => v.id),
                    });
                }
            }

            setOpenModal(false);
            setEditingElection(null);
            await fetchElections();
        } catch (err: any) {
            console.error(err);

            if (err?.response?.data?.message) {
                showMessage(err.response.data.message, 'error');
            } else {
                showMessage('Something went wrong', 'error');
            }
        }
    };

    const deleteElection = async (id: string) => {
        if (!confirm('Bạn chắc chắn muốn xóa cuộc bầu cử này?')) return;
        try {
            await adminService.deleteElection(id);
            await fetchElections();
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
        const labels = { pending: 'Chưa bắt đầu', active: 'Đang diễn ra', completed: 'Đã kết thúc', cancelled: 'Đã hủy' };
        return (
            <span className={`px-2.5 py-1 text-xs font-bold border rounded-lg ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Quản lý cuộc bầu cử</h2>

                {role === 'SUPER_ADMIN' && (
                    <button
                        onClick={() => handleOpenCreate()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                        Tạo mới
                    </button>
                )}

            </div>

            <ElectionFormModal
                role={role!}
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSubmit={handleSubmitElection}
                initialData={editingElection}
                mode={editingElection ? 'edit' : 'create'}
            />

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {elections.length === 0 ? (
                        <p className="text-center text-slate-500 italic py-8">Chưa có cuộc bầu cử nào</p>
                    ) : (
                        elections.map((election) => (
                            <div
                                key={election.id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight mb-2">{election.name}</h3>
                                        {election.description && (
                                            <p className="text-sm text-slate-600 mb-3">{election.description}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {getStatusBadge(election.status)}
                                            <span className="text-xs px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded">
                                                {election.visibility === 'public' ? 'Công khai' : 'Riêng tư'}
                                            </span>
                                            {election.isAutomatic && (
                                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded">
                                                    Tự động
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleEdit(election)}
                                        className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-bold"
                                    >
                                        Sửa
                                    </button>
                                    {role === 'SUPER_ADMIN' && (
                                        <button
                                            onClick={() => deleteElection(election.id)}
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
