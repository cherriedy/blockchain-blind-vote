'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElectionsManager from '@/components/admin/elections/ElectionsManager';
import PollsManager from '@/components/admin/polls/PollsManager';
import VotersManager from '@/components/admin/VotersManager';
import CandidatesManager from '@/components/admin/CandidatesManager';
import { AdminRole, Admin } from '@/lib/types/admin';
import AdminsManager from '@/components/admin/AdminsManager';
import { adminService } from '@/services/admin.service';
import { useSnackbar } from '@/components/core/SnackbarContext';
import AuditLogManager from '@/components/admin/AuditLogManager';
import SelfNominationManager from '@/components/admin/self-nominations/SelfNominationManager';

export default function AdminDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [admin, setAdmin] = useState<Admin>();
  const [activeTab, setActiveTab] = useState<string>('nomination');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await adminService.getMe();
        setRole(res.data.role);
        setAdmin(res.data);

        // Mặc định tab cho từng role nếu không phải Super
        if (res.data.role === 'ELECTION_ADMIN') setActiveTab('elections');
        if (res.data.role === 'POLL_ADMIN') setActiveTab('polls');
      } catch (err) {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Hàm xác định xem tab có được hiển thị hay không
  const canSeeTab = (tabName: string) => {
    if (role === 'SUPER_ADMIN') return true;
    if (role === 'ELECTION_ADMIN') {
      return ['nomination', 'elections', 'voters', 'candidates'].includes(tabName);
    }
    if (role === 'POLL_ADMIN') {
      return ['polls', 'voters', 'candidates'].includes(tabName);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13 6a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM13 18a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">
              Quản lý hệ thống
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{admin.name}</p>
                <p className="text-[10px] text-slate-400 uppercase">{admin.role}</p>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('walletAddress');
                localStorage.removeItem('studentId');
                router.replace('/login');
              }}
              className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Đang tải...
            </p>
          </div>
        ) : (
          <>
            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {canSeeTab('nomination') && (
                <TabButton
                  active={activeTab === 'nomination'}
                  onClick={() => setActiveTab('nomination')}
                  label="Tự ứng cử"
                />
              )}

              {canSeeTab('elections') && (
                <TabButton
                  active={activeTab === 'elections'}
                  onClick={() => setActiveTab('elections')}
                  label="Bầu cử"
                />
              )}

              {canSeeTab('polls') && (
                <TabButton
                  active={activeTab === 'polls'}
                  onClick={() => setActiveTab('polls')}
                  label="Khảo sát"
                />
              )}

              {canSeeTab('voters') && (
                <TabButton
                  active={activeTab === 'voters'}
                  onClick={() => setActiveTab('voters')}
                  label="Cử tri"
                />
              )}

              {canSeeTab('candidates') && (
                <TabButton
                  active={activeTab === 'candidates'}
                  onClick={() => setActiveTab('candidates')}
                  label="Ứng viên"
                />
              )}

              {role === 'SUPER_ADMIN' && (
                <>
                  <TabButton
                    active={activeTab === 'admins'}
                    onClick={() => setActiveTab('admins')}
                    label="Quản trị viên"
                  />
                  <TabButton
                    active={activeTab === 'audit-logs'}
                    onClick={() => setActiveTab('audit-logs')}
                    label="Lịch sử hoạt động"
                  />
                </>
              )}
            </div>

            <div className="tab-content">
              {activeTab === 'nomination' && canSeeTab('nomination') && (
                <SelfNominationManager />
              )}
              {activeTab === 'elections' && canSeeTab('elections') && (
                <ElectionsManager role={role} />
              )}
              {activeTab === 'polls' && canSeeTab('polls') && <PollsManager role={role} />}
              {activeTab === 'voters' && canSeeTab('voters') && <VotersManager role={role} />}
              {activeTab === 'candidates' && canSeeTab('candidates') && (
                <CandidatesManager role={role} />
              )}
              {activeTab === 'admins' && role === 'SUPER_ADMIN' && <AdminsManager />}
              {activeTab === 'audit-logs' && role === 'SUPER_ADMIN' && <AuditLogManager />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${active
        ? 'bg-slate-900 text-white shadow-lg'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
    >
      {label}
    </button>
  );
}
