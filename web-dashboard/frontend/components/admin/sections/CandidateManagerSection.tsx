'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import { Candidate } from '@/lib/types/admin';
import { adminService } from '@/services/admin.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
    electionId?: string; // edit mode
    form: any;
    setForm: (val: any) => void;
}

export default function CandidateManagerSection({
    electionId,
    form,
    setForm
}: Props) {
    const [candidateSearch, setCandidateSearch] = useState('');
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([]);

    const [assignedCandidates, setAssignedCandidates] = useState<Candidate[]>([]);
    const [selfNominees, setSelfNominees] = useState<Candidate[]>([]);

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'reject' | 'request'>('reject');
    const [note, setNote] = useState('');

    const [openDetail, setOpenDetail] = useState(false);
    const [selectedNominee, setSelectedNominee] = useState<any>(null);

    // LOAD
    useEffect(() => {
        if (electionId) {
            loadElectionCandidates(electionId);
        }
    }, [electionId]);

    const loadElectionCandidates = async (id: string) => {
        try {
            const res = await adminService.getElectionCandidates(id);
            setAssignedCandidates(res.data.assigned);
            setSelfNominees(res.data.selfNominated);
        } catch {
            alert('Lỗi load candidates');
        }
    };

    // SEARCH
    const searchCandidate = async (val: string) => {
        if (val.length > 1) {
            const res = await adminService.getCandidates(val);

            const filtered = res.data.filter(
                (c: Candidate) =>
                    !form.candidateIds.includes(c.id) &&
                    !selectedCandidates.some(sc => sc.id === c.id)
            );

            setCandidates(filtered);
        } else {
            setCandidates([]);
        }
    };

    // ADD
    const handleAddCandidate = (c: Candidate) => {
        if (!form.candidateIds.includes(c.id)) {
            setForm({
                ...form,
                candidateIds: [...form.candidateIds, c.id],
            });
            setSelectedCandidates(prev => [...prev, c]);
        }
    };

    // REMOVE
    const handleRemoveCandidate = (id: string) => {
        setAssignedCandidates(prev => prev.filter(c => c.id !== id));

        setForm({
            ...form,
            candidateIds: form.candidateIds.filter((cid: string) => cid !== id),
        });
    };

    // APPROVE
    const approveCandidate = async (candidateId: string) => {
        if (!electionId) return;

        await adminService.approveSelfNominee(electionId, candidateId);
        loadElectionCandidates(electionId);
    };

    const handleSubmitFromDialog = async () => {
        if (!electionId || !selectedCandidateId) return;

        if (!note.trim()) {
            alert('Vui lòng nhập ghi chú');
            return;
        }

        try {
            if (actionType === 'reject') {
                await adminService.rejectSelfNominee(
                    electionId,
                    selectedCandidateId,
                    note
                );
            } else {
                await adminService.requestInfoSelfNominee(
                    electionId,
                    selectedCandidateId,
                    note
                );
            }

            setOpenDialog(false);
            setNote('');
            setSelectedCandidateId(null);

            loadElectionCandidates(electionId);
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra');
        }
    };

    const fetchNomineeDetail = async (candidateId: string) => {
  if (!electionId) return;

  try {
    const res = await adminService.getSelfNominees(electionId);

    // tìm đúng candidate
    const nominee = res.data.find((n: any) => n.candidateId === candidateId);

    setSelectedNominee(nominee);
    setOpenDetail(true);
  } catch (err) {
    console.error(err);
    alert('Lỗi khi lấy chi tiết');
  }
};

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">
                Danh sách ứng cử viên
            </p>

            {/* SEARCH */}
            <div className="relative">
                <Input
                    placeholder="Tìm theo MSSV hoặc họ tên SV..."
                    value={candidateSearch}
                    onChange={(e) => {
                        setCandidateSearch(e.target.value);
                        searchCandidate(e.target.value);
                    }}
                />

                {candidates.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-xl max-h-52 overflow-auto">
                        {candidates.map((c) => (
                            <div
                                key={c.id}
                                className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex justify-between"
                                onClick={() => {
                                    handleAddCandidate(c);
                                    setCandidateSearch('');
                                    setCandidates([]);
                                }}
                            >
                                <div>
                                    <p className="text-sm font-medium">{c.name}</p>
                                    <p className="text-xs text-slate-400">{c.studentId}</p>
                                </div>
                                <PlusIcon className="w-4 h-4 text-blue-500" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SELECTED (NEW ADD) */}
            <div className="flex flex-wrap gap-2">
                {selectedCandidates.map((c) => (
                    <div key={c.id} className="bg-blue-100 px-2 py-1 text-xs rounded">
                        {c.name}
                        <button
                            onClick={() =>
                                setSelectedCandidates(prev =>
                                    prev.filter(i => i.id !== c.id)
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* ASSIGNED */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">Đã duyệt</p>
                {assignedCandidates.length > 0 ? (
                    assignedCandidates.map((c) => (
                        <Card key={c.id}>
                            <CardContent className="flex justify-between p-3">
                                <span>{c.name}</span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveCandidate(c.id)}
                                >
                                    Xóa
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-sm text-center text-slate-400 italic">Chưa có ứng viên đã duyệt</p>
                )}
            </div>

            {/* SELF NOMINATION */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-orange-500">
                    Chờ duyệt
                </p>
                {selfNominees.length > 0 ? (
                    selfNominees.map((c) => (
                        <Card key={c.id} onClick={() => fetchNomineeDetail(c.id)}
                            className="cursor-pointer hover:bg-slate-50">
                            <CardContent className="flex justify-between p-3 gap-2">
                                <span>{c.name}</span>
                                <div className="flex gap-2">
                                    <Button size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            approveCandidate(c.id)
                                        }}>
                                        Duyệt
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCandidateId(c.id);
                                            setActionType('reject');
                                            setOpenDialog(true);
                                        }}
                                    >
                                        Từ chối
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCandidateId(c.id);
                                            setActionType('request');
                                            setOpenDialog(true);
                                        }}
                                    >
                                        Yêu cầu bổ sung
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-sm text-center text-slate-400 italic">Chưa có ứng viên tự bầu cử</p>
                )}
            </div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'reject' ? 'Từ chối ứng viên' : 'Yêu cầu bổ sung'}
                        </DialogTitle>
                    </DialogHeader>

                    <textarea
                        placeholder="Nhập ghi chú..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            Hủy
                        </Button>

                        <Button
                            variant={actionType === 'reject' ? 'destructive' : 'default'}
                            onClick={handleSubmitFromDialog}
                        >
                            Xác nhận
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openDetail} onOpenChange={setOpenDetail}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thông tin ứng viên</DialogTitle>
                    </DialogHeader>

                    {selectedNominee && (
                        <div className="space-y-4">

                            {/* Avatar + name */}
                            <div className="flex items-center gap-3">
                                {selectedNominee?.candidate && (
                                <img
                                    src={
                                        selectedNominee?.candidate?.avatarUrl?.startsWith('http')
                                            ? selectedNominee.candidate.avatarUrl
                                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}${selectedNominee.candidate.avatarUrl}`
                                    }
                                    alt="avatar"
                                    className="w-12 h-12
                                     rounded-full object-cover"
                                />
                                )}
                                <div>
                                    <p className="font-semibold">{selectedNominee.candidate?.name}</p>
                                    <p className="text-xs text-gray-500">
                                        MSSV: {selectedNominee.candidate?.studentId}
                                    </p>
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <p className="text-sm font-medium">Giới thiệu:</p>
                                <p className="text-sm text-gray-600">
                                    {selectedNominee.introduction || 'Không có'}
                                </p>
                            </div>

                            {/* CreatedAt */}
                            <div>
                                <p className="text-sm font-medium">Ngày đăng ký:</p>
                                <p className="text-sm text-gray-600">
                                    {new Date(selectedNominee.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-sm font-medium">Trạng thái:</p>
                                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded">
                                    {selectedNominee.status}
                                </span>
                            </div>

                            {/* Admin note (nếu có) */}
                            {selectedNominee.adminNotes && (
                                <div>
                                    <p className="text-sm font-medium">Ghi chú admin:</p>
                                    <p className="text-sm text-red-500">
                                        {selectedNominee.adminNotes}
                                    </p>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}