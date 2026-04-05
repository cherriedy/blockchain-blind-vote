'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PollIcon from '@mui/icons-material/Poll';

import ElectionCard from '@/components/dashboard/ElectionCard';
import PollCard from '@/components/dashboard/PollCard';
import DetailModal from '@/components/dashboard/DetailModal';
import EmptyState from '@/components/dashboard/EmptyState';
import { shortenWallet } from '@/lib/format';
import { publicApiService } from '@/services/public.service';
import authService from '@/services/auth.service';
import { Election, Poll, SelfNomination } from '@/lib/types/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [elections, setElections] = useState<Election[]>([]);
  const [publicElections, setPublicElections] = useState<Election[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('elections');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'election' | 'poll' | null>(null);

  const [selfNominations, setSelfNominations] = useState<SelfNomination[]>([]);
  const [selectedNominationItem, setSelectedNominationItem] = useState<any>(null);
  const [openResubmit, setOpenResubmit] = useState(false);
  const [intro, setIntro] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sid = localStorage.getItem('studentId');
      const wallet = localStorage.getItem('walletAddress');

      if (!wallet || !sid) {
        return;
      }

      setStudentId(sid);
      setWalletAddress(wallet);

      const [publicRes, electionsRes, pollsRes, selfNomRes] = await Promise.allSettled([
        publicApiService.getPublicElection(wallet, sid),
        publicApiService.getEligibleElection(wallet, sid),
        publicApiService.getEligiblePoll(wallet, sid),
        publicApiService.getMySelfNominations(wallet, sid),
      ]);

      if (publicRes.status === 'fulfilled') {
        setPublicElections(publicRes.value.data ?? []);
      } else {
        if (publicRes.reason?.response?.status !== 404)
          console.error('Elections fetch error', publicRes.reason);
        setPublicElections([]);
      }

      if (electionsRes.status === 'fulfilled') {
        setElections(electionsRes.value.data ?? []);
      } else {
        if (electionsRes.reason?.response?.status !== 404)
          console.error('Elections fetch error', electionsRes.reason);
        setElections([]);
      }

      if (pollsRes.status === 'fulfilled') {
        setPolls(pollsRes.value.data ?? []);
      } else {
        if (pollsRes.reason?.response?.status !== 404)
          console.error('Polls fetch error', pollsRes.reason);
        setPolls([]);
      }
      if (selfNomRes.status === 'fulfilled') {
        setSelfNominations(selfNomRes.value.data ?? []);
      } else {
        if (selfNomRes.reason?.response?.status !== 404)
          console.error('Self nomination fetch error', selfNomRes.reason);
        setSelfNominations([]);
      }
    } catch {
      setError('Không thể kết nối máy chủ. Hãy đảm bảo backend đang chạy.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      // best-effort: inform backend about logout
      await authService
        .logout(
          localStorage.getItem('studentId') || '',
          localStorage.getItem('walletAddress') || '',
        )
        .catch(() => {});
    } catch (e) {
      // ignore errors from logout call, continue to clear client state
      console.warn('logout request failed', e);
    }

    localStorage.removeItem('studentId');
    localStorage.removeItem('walletAddress');
    router.push('/login');
  };

  const openDetail = (item: any, type: 'election' | 'poll') => {
    setSelectedItem(item);
    setSelectedType(type);
  };

  const activeCount =
    elections.filter((e: any) => e.status === 'active').length +
    polls.filter((p: any) => p.status === 'active').length;

  const handleResubmit = (item: SelfNomination) => {
    setSelectedNominationItem(item);
    setName(item.candidate.name || '');
    setBio(item.candidate.bio || '');
    setIntro(item.introduction || '');
    setPreview(null);
    setFile(null);
    setOpenResubmit(true);
  };
  const submitResubmit = async () => {
    if (!selectedNominationItem) return;

    if (!intro.trim()) {
      alert('Vui lòng nhập nội dung');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('walletAddress', walletAddress);
      formData.append('studentId', studentId);
      formData.append('introduction', intro);

      if (name) formData.append('name', name);
      if (bio) formData.append('bio', bio);
      if (file) formData.append('avatar', file);

      await publicApiService.resubmitSelfNomination(selectedNominationItem.electionId, formData);

      alert('Gửi lại thành công!');
      setOpenResubmit(false);
      setSelectedNominationItem(null);
      setIntro('');
      setName('');
      setBio('');
      setFile(null);

      loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi resubmit');
    }
  };

  return (
    <div className="dash-page min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">
              Bảng điều khiển
            </h1>
            {activeCount > 0 && (
              <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-green-200">
                {activeCount} đang diễn ra
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                {studentId}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[10px] font-mono text-slate-400">
                {shortenWallet(walletAddress)}
              </span>
            </div>
            <button
              onClick={() => loadData()}
              title="Tải lại"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline px-2"
            >
              Thoát
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* ── Welcome Banner ── */}
        <div className="mb-8 p-7 bg-linear-to-br from-blue-600 to-indigo-700 rounded-4xl text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          ></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">
              Xin chào,
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight">{studentId}</h2>
            <p className="text-sm font-mono opacity-60 mt-1">{walletAddress}</p>
            <div className="mt-5 flex flex-wrap gap-4">
              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  {elections.length} Bầu cử được giao
                </span>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  {polls.length} Khảo sát được giao
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 mb-8 w-fit shadow-sm">
          {/* Bầu cử công khai */}
          <button
            onClick={() => setActiveTab('public')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'public'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HowToVoteIcon sx={{ fontSize: 16 }} />
            Bầu cử công khai
            {publicElections.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'public' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}
              >
                {publicElections.length}
              </span>
            )}
          </button>

          {/* Bầu cử */}
          <button
            onClick={() => setActiveTab('elections')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'elections'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HowToVoteIcon sx={{ fontSize: 16 }} />
            Bầu cử
            {elections.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'elections' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}
              >
                {elections.length}
              </span>
            )}
          </button>

          {/* Khảo sát */}
          <button
            onClick={() => setActiveTab('polls')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'polls'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PollIcon sx={{ fontSize: 16 }} />
            Khảo sát
            {polls.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'polls' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}
              >
                {polls.length}
              </span>
            )}
          </button>

          {/* Tự ứng cử */}
          <button
            onClick={() => setActiveTab('self-nominations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'self-nominations'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HowToVoteIcon sx={{ fontSize: 16 }} />
            Tự ứng cử
            {selfNominations.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                  activeTab === 'self-nominations' ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {selfNominations.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-3xl p-7 animate-pulse"
              >
                <div className="flex justify-between mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                  <div className="w-24 h-6 bg-slate-100 rounded-full"></div>
                </div>
                <div className="h-5 bg-slate-100 rounded-lg w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-full mb-1"></div>
                <div className="h-4 bg-slate-100 rounded-lg w-2/3 mb-6"></div>
                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <div className="h-3 bg-slate-100 rounded w-20"></div>
                  <div className="h-3 bg-slate-100 rounded w-16 ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'public' ? (
          publicElections.length === 0 ? (
            <EmptyState type="election" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {publicElections.map((e: any) => (
                <ElectionCard
                  key={e.id}
                  election={e}
                  onClick={(item) => openDetail(item, 'election')}
                />
              ))}
            </div>
          )
        ) : activeTab === 'elections' ? (
          elections.length === 0 ? (
            <EmptyState type="election" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {elections.map((e: any) => (
                <ElectionCard
                  key={e.id}
                  election={e}
                  onClick={(item) => openDetail(item, 'election')}
                />
              ))}
            </div>
          )
        ) : activeTab === 'poll' ? (
          polls.length === 0 ? (
            <EmptyState type="poll" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {polls.map((p: any) => (
                <PollCard key={p.id} poll={p} onClick={(item) => openDetail(item, 'poll')} />
              ))}
            </div>
          )
        ) : selfNominations.length === 0 ? (
          <EmptyState type="election" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {selfNominations.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition"
              >
                {/* Election */}
                <h3 className="font-bold text-sm mb-2">{item.election?.name}</h3>

                {/* Status */}
                <p className="text-xs mb-1">
                  Trạng thái: <b>{item.status}</b>
                </p>

                {/* Intro */}
                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                  {item.introduction || 'Không có mô tả'}
                </p>

                {/* Admin note */}
                {item.adminNotes && <p className="text-xs text-red-500 mb-2">{item.adminNotes}</p>}

                {/* Time */}
                <p className="text-[10px] text-slate-400 mb-3">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </p>

                {/* Action */}
                {item.status === 'REQUEST_INFO' && (
                  <button
                    onClick={() => handleResubmit(item)}
                    className="w-full py-1.5 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Gửi lại
                  </button>
                )}

                {item.status === 'PENDING' && (
                  <span className="text-xs text-yellow-600 font-bold">Đang chờ duyệt</span>
                )}

                {item.status === 'APPROVED' && (
                  <span className="text-xs text-green-600 font-bold">Đã duyệt</span>
                )}

                {item.status === 'REJECTED' && (
                  <span className="text-xs text-red-600 font-bold">Bị từ chối</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          type={selectedType}
          onClose={() => {
            setSelectedItem(null);
            setSelectedType(null);
          }}
        />
      )}

      <Dialog open={openResubmit} onOpenChange={setOpenResubmit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gửi lại đơn ứng cử</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-semibold mb-1">Ảnh đại diện</p>
              <img
                src={
                  preview
                    ? preview
                    : selectedNominationItem?.candidate?.avatarUrl?.startsWith('http')
                      ? selectedNominationItem.candidate.avatarUrl
                      : `${process.env.NEXT_PUBLIC_BACKEND_URL}${selectedNominationItem?.candidate?.avatarUrl}`
                }
                className="w-32 h-32 rounded-xl object-cover border"
              />
              <label className="text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-600">
                Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreview(URL.createObjectURL(f)); // preview ảnh mới
                    }
                  }}
                />
              </label>
            </div>

            {/* Name */}
            <div>
              <p className="text-sm font-semibold mb-1">Tên</p>
              <input
                className="w-full border rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Bio */}
            <div>
              <p className="text-sm font-semibold mb-1">Tiểu sử</p>
              <textarea
                className="w-full border rounded p-2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm font-semibold mb-1">Nội dung giới thiệu</p>
              <textarea
                className="w-full border rounded p-2 min-h-[120px]"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Nhập nội dung..."
              />
            </div>

            {selectedNominationItem?.adminNotes && (
              <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-600">
                <b>Ghi chú từ admin:</b>
                <p>{selectedNominationItem.adminNotes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => setOpenResubmit(false)}>
                Hủy
              </button>

              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitResubmit}>
                Gửi lại
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
