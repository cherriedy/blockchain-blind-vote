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

    const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const fetchAll = async (status?: SelfNominationFilterStatus) => {
        setLoading(true);
        try {
            const res = await adminService.getAllSelfNominees(status);
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
        fetchAll(statusFilter);
    }, [statusFilter]);

    const statusColor: Record<SelfNominationFilterStatus, string> = {
        ALL: 'bg-gray-100',
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
        REQUEST_INFO: 'bg-orange-100 text-orange-700',
    };

    return (
        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Quản lý tự ứng cử</h2>

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
            </div>

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
                                    <p className="font-semibold">
                                        {item.candidate?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.election?.name}
                                    </p>
                                </div>

                                {/* RIGHT */}
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded ${statusColor[item.status as SelfNominationFilterStatus]}`}>
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
                <DialogTitle>

                </DialogTitle>
                <DialogContent className="max-w-4xl">
                    {selectedElectionId && (
                        <SelfNominationModal electionId={selectedElectionId} />
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}