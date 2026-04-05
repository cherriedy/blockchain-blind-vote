'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import { Voter } from '@/lib/types/admin';
import { adminService } from '@/services/admin.service';

interface Props {
  objectId?: string;
  objectType: 'ELECTION' | 'POLL';

  addedVoters: Voter[];
  setAddedVoters: (val: Voter[]) => void;

  removedVoterIds: string[];
  setRemovedVoterIds: (val: string[]) => void;
}

export default function VoterManagerSection({
  objectId,
  objectType,
  addedVoters,
  setAddedVoters,
  removedVoterIds,
  setRemovedVoterIds,
}: Props) {
  const [search, setSearch] = useState('');
  const [voters, setVoters] = useState<Voter[]>([]);
  const [objectVoters, setObjectVoters] = useState<any[]>([]);

  // LOAD
  useEffect(() => {
    if (objectId) {
      loadObjectVoters(objectId, objectType);
    }
  }, [objectId, objectType]);

  const loadObjectVoters = async (id: string, type: 'ELECTION' | 'POLL') => {
    try {
      let res;
      if (type === 'ELECTION') {
        res = await adminService.getElectionVoters(id);
      } else {
        res = await adminService.getPollVoters(id);
      }
      setObjectVoters(res.data);
      console.log('Loaded voters:', res.data);
    } catch {
      alert('Lỗi load voters');
    }
  };

  const searchVoter = async (val: string) => {
    if (val.length > 1) {
      const res = await adminService.getVoters(val);

      const filtered = res.data.filter(
        (v: Voter) =>
          !objectVoters.some((ev) => ev.voterId === v.id) &&
          !addedVoters.some((av) => av.id === v.id),
      );

      setVoters(filtered);
    } else {
      setVoters([]);
    }
  };

  const handleAdd = (v: Voter) => {
    setAddedVoters([...addedVoters, v]);
  };

  const handleRemove = (id: string) => {
    setObjectVoters((prev) => prev.filter((v) => v.voterId !== id));
    setRemovedVoterIds([...removedVoterIds, id]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">Danh sách cử tri</p>

      {/* SEARCH */}
      <div className="relative">
        <Input
          placeholder="Tìm theo MSSV hoặc họ tên SV..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            searchVoter(e.target.value);
          }}
        />

        {voters.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border rounded shadow max-h-40 overflow-auto">
            {voters.map((v) => (
              <div
                key={v.id}
                className="p-2 hover:bg-gray-100 flex justify-between cursor-pointer"
                onClick={() => {
                  handleAdd(v);
                  setSearch('');
                  setVoters([]);
                }}
              >
                <span>
                  {' '}
                  {v.name}
                  <small className="text-slate-400 ml-1">({v.studentId})</small>
                </span>
                <PlusIcon className="w-4 h-4 text-blue-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADDED */}
      <div className="flex flex-wrap gap-2">
        {addedVoters.map((v) => (
          <div key={v.id} className="bg-blue-100 px-2 py-1 text-xs">
            {v.name}
            <button onClick={() => setAddedVoters(addedVoters.filter((x) => x.id !== v.id))}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* EXISTING */}
      <div className="space-y-2">
        {objectVoters.length === 0 ? (
          <p className="text-sm text-center text-slate-400 italic"> Chưa có cử tri </p>
        ) : (
          objectVoters.map((v: any) => (
            <Card key={v.voterId}>
              <CardContent className="flex justify-between p-3">
                <span>
                  {' '}
                  {v.voter.studentId} - {v.voter.name}{' '}
                </span>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(v.voterId)}>
                  Xóa
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
