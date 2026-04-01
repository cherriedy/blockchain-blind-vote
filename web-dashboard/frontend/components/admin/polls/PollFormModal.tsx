'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import AdminManagerSection from '../sections/AdminManagerSection';
import VoterManagerSection from '../sections/VoterManagerSection';

export default function PollFormModal({
    open,
    onClose,
    onSubmit,
    initialData,
    mode,
}: any) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        visibility: 'public',
        question: '',
        options: [''],
        isAutomatic: false,
        startAt: '',
        endAt: '',
    });

    const [addedAdmins, setAddedAdmins] = useState<any[]>([]);
    const [removedAdminIds, setRemovedAdminIds] = useState<string[]>([]);
    const [addedVoters, setAddedVoters] = useState<any[]>([]);
    const [removedVoterIds, setRemovedVoterIds] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setAddedAdmins([]);
            setRemovedAdminIds([]);

            setAddedVoters([]);
            setRemovedVoterIds([]);

            if (initialData) {
                setForm({
                    ...initialData,
                    startAt: initialData.startAt
                        ? new Date(initialData.startAt).toISOString().slice(0, 16)
                        : '',
                    endAt: initialData.endAt
                        ? new Date(initialData.endAt).toISOString().slice(0, 16)
                        : '',
                });
            } else {
                setForm({
                    name: '',
                    description: '',
                    visibility: 'public',
                    question: '',
                    options: [''],
                    isAutomatic: false,
                    startAt: '',
                    endAt: '',
                });
            }
        }
    }, [open, initialData]);

    const handleSubmitLocal = () => {
        onSubmit({
            ...form,
            addedAdmins,
            removedAdminIds,
            addedVoters,
            removedVoterIds,
        });
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...form.options];
        newOptions[index] = value;
        setForm({ ...form, options: newOptions });
    };

    const addOption = () => {
        setForm({ ...form, options: [...form.options, ''] });
    };

    const removeOption = (index: number) => {
        setForm({
            ...form,
            options: form.options.filter((_, i) => i !== index),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl w-full h-[90vh] flex flex-col p-0">

                {/* HEADER */}
                <DialogHeader className="px-6 py-4 border-b text-center">
                    <DialogTitle className="text-lg font-semibold">
                        {mode === 'create' ? 'Tạo Poll' : 'Cập nhật Poll'}
                    </DialogTitle>
                </DialogHeader>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* BASIC INFO */}
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-slate-700">
                            Thông tin cơ bản
                        </p>

                        <Input
                            placeholder="Tên poll..."
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                        />

                        <textarea
                            placeholder="Mô tả..."
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            rows={3}
                        />
                    </div>

                    {/* SETTINGS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-semibold mb-1">
                                Chế độ hiển thị
                            </p>
                            <select
                                value={form.visibility}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        visibility: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border rounded-md text-sm"
                            >
                                <option value="public">Công khai</option>
                                <option value="private">Riêng tư</option>
                            </select>
                        </div>
                    </div>

                    {/* QUESTION */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">
                            Câu hỏi
                        </p>

                        <Input
                            placeholder="Nhập câu hỏi..."
                            value={form.question}
                            onChange={(e) =>
                                setForm({ ...form, question: e.target.value })
                            }
                        />
                    </div>

                    {/* OPTIONS */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">
                            Lựa chọn
                        </p>

                        {form.options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    value={opt}
                                    onChange={(e) =>
                                        updateOption(i, e.target.value)
                                    }
                                    placeholder={`Option ${i + 1}`}
                                />

                                {form.options.length > 1 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeOption(i)}
                                    >
                                        X
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                        >
                            + Thêm lựa chọn
                        </Button>
                    </div>

                    {/* SCHEDULE */}
                    <div className="space-y-3 border-t pt-5">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.isAutomatic}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        isAutomatic: e.target.checked,
                                    })
                                }
                            />
                            <span className="text-sm font-medium">
                                Lên lịch tự động
                            </span>
                        </div>

                        {form.isAutomatic && (
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="datetime-local"
                                    value={form.startAt}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            startAt: e.target.value,
                                        })
                                    }
                                />
                                <Input
                                    type="datetime-local"
                                    value={form.endAt}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            endAt: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* ADMIN */}
                    <div className="mt-4 border-t pt-4">
                        <AdminManagerSection
                            objectId={initialData?.id}
                            objectType="POLL"
                            addedAdmins={addedAdmins}
                            setAddedAdmins={setAddedAdmins}
                            removedAdminIds={removedAdminIds}
                            setRemovedAdminIds={setRemovedAdminIds}
                        />
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <VoterManagerSection
                            objectId={initialData?.id}
                            objectType="POLL"
                            addedVoters={addedVoters}
                            setAddedVoters={setAddedVoters}
                            removedVoterIds={removedVoterIds}
                            setRemovedVoterIds={setRemovedVoterIds}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Đóng
                    </Button>

                    <Button
                        onClick={handleSubmitLocal}
                        disabled={!form.name || !form.question}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {mode === 'create' ? 'Tạo' : 'Cập nhật'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}