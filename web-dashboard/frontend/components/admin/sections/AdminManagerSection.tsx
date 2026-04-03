'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import { Admin } from '@/lib/types/admin';
import { adminService } from '@/services/admin.service';

interface Props {
    objectId?: string;
    objectType: 'ELECTION' | 'POLL';

    addedAdmins: Admin[];
    setAddedAdmins: (val: Admin[]) => void;

    removedAdminIds: string[];
    setRemovedAdminIds: (val: string[]) => void;
}

export default function AdminManagerSection({
    objectId,
    objectType,
    addedAdmins,
    setAddedAdmins,
    removedAdminIds,
    setRemovedAdminIds
}: Props) {
    const [search, setSearch] = useState('');
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [objectAdmins, setObjectAdmins] = useState<any[]>([]);

    // LOAD
    useEffect(() => {
        if (objectId) {
            loadObjectAdmins(objectId, objectType);
        }
    }, [objectId, objectType]);

    const loadObjectAdmins = async (id: string, type: 'ELECTION' | 'POLL') => {
        try {
            let res;
            if (type === 'ELECTION') {
                res = await adminService.getElectionAdmins(id);
            } else {
                res = await adminService.getPollAdmins(id);
            }
            setObjectAdmins(res.data);
        } catch {
            alert('Lỗi load admins');
        }
    };

    // SEARCH
    const searchAdmin = async (val: string) => {
        if (val.length > 1) {
            const res = await adminService.getAdmins(val, `${objectType}_ADMIN`);
            const filtered = res.data.filter((a: Admin) =>
                !objectAdmins.some(ea => ea.adminId === a.id) &&
                !addedAdmins.some(sa => sa.id === a.id)
            );
            setAdmins(filtered);
        } else {
            setAdmins([]);
        }
    };

    // ADD
    const handleAdd = (admin: Admin) => {
        setAddedAdmins([...addedAdmins, admin]);
    };

    // REMOVE EXISTING
    const handleRemove = (adminId: string) => {
        setObjectAdmins(prev => prev.filter(a => a.adminId !== adminId));
        setRemovedAdminIds([...removedAdminIds, adminId]);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold">Danh sách admin</p>

            {/* SEARCH */}
            <div className="relative">
                <Input
                    placeholder="Tìm theo họ tên admin..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        searchAdmin(e.target.value);
                    }}
                />

                {admins.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow max-h-40 overflow-auto">
                        {admins.map(a => (
                            <div
                                key={a.id}
                                className="p-2 hover:bg-gray-100 flex justify-between cursor-pointer"
                                onClick={() => {
                                    handleAdd(a);
                                    setSearch('');
                                    setAdmins([]);
                                }}
                            >
                                {a.name}
                                <PlusIcon className="w-4" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ADDED */}
            <div className="flex flex-wrap gap-2">
                {addedAdmins.map(a => (
                    <div key={a.id} className="bg-blue-100 px-2 py-1 text-xs">
                        {a.name}
                        <button
                            onClick={() =>
                                setAddedAdmins(addedAdmins.filter(x => x.id !== a.id))
                            }
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* EXISTING */}
            <div className="space-y-2">
                {objectAdmins.length === 0 ? (
                    <p className="text-sm text-center text-slate-400 italic"> Chưa có admin bầu cử</p>
                ) : (objectAdmins.map((a: any) => (
                    <Card key={a.adminId}>
                        <CardContent className="flex justify-between p-3">
                            <span> {a.admin.name} </span>
                            <Button variant="destructive" size="sm" onClick={() => handleRemove(a.adminId)} >
                                Xóa
                            </Button>
                        </CardContent>
                    </Card>
                )))}
            </div>
        </div>
    );
}