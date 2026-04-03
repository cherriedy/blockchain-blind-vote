import { useState, useEffect } from 'react';
import { Admin } from '@/lib/types/admin';
import { adminService } from '@/services/admin.service';
import { useSnackbar } from '../core/SnackbarContext';

export default function AdminsManager() {
  const { showMessage } = useSnackbar();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const [form, setForm] = useState({
    name: '',
    walletAddress: '',
    role: 'ELECTION_ADMIN',
    isActive: true,
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdmins();
      setAdmins(res.data);
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
    fetchAdmins();
  }, []);

  // ================= CREATE =================
  const handleCreate = async () => {
    try {
      await adminService.createAdmin(form);
      setForm({ name: '', walletAddress: '', role: 'ELECTION_ADMIN', isActive: true, });
      setShowCreate(false);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    if (!editingAdmin) return;

    try {
      await adminService.updateAdmin(editingAdmin.id, form);
      setEditingAdmin(null);
      setForm({ name: '', walletAddress: '', role: 'ELECTION_ADMIN', isActive: true, });
      fetchAdmins();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa admin này?')) return;

    try {
      await adminService.deleteAdmin(id);
      fetchAdmins();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.data?.message) {
        showMessage(err.response.data.message, 'error');
      } else {
        showMessage('Something went wrong', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black uppercase">Quản lý Admin hệ thống</h2>
        <button
          onClick={() => {
            setShowCreate(true);
            setForm({
              name: '',
              walletAddress: '',
              role: 'ELECTION_ADMIN',
              isActive: true
            });
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
        >
          Thêm admin
        </button>
      </div>

      {(showCreate || editingAdmin) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-slate-900 uppercase">{editingAdmin ? 'Cập nhật admin' : 'Thêm admin mới'}</h3>
          <input
            type="text"
            placeholder="Tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="text"
            placeholder="Địa chỉ ví (0x...)"
            value={form.walletAddress}
            disabled={!!editingAdmin}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-50 
             disabled:text-slate-400 
             disabled:cursor-not-allowed 
             disabled:border-slate-100"
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border px-3 py-2 rounded-lg cursor-pointer"
          >
            <option value="ELECTION_ADMIN">Election Admin</option>
            <option value="POLL_ADMIN">Poll Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg">
            <span className="text-sm font-semibold text-slate-700">
              Trạng thái hoạt động
            </span>

            <button
              type="button"
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  isActive: !prev.isActive
                }))
              }
              className={`relative w-12 h-6 rounded-full transition-all ${form.isActive ? 'bg-green-500' : 'bg-slate-300'
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${form.isActive ? 'translate-x-6' : ''
                  }`}
              />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={editingAdmin ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all"
            >
              {editingAdmin ? 'Cập nhật' : 'Thêm'}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setEditingAdmin(null);
              }}
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
        <table className="w-full bg-white rounded-2xl overflow-hidden shadow-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4 text-left">Họ tên</th>
              <th className="px-6 py-4 text-left">Địa chỉ ví</th>
              <th className="px-6 py-4 text-left">Vai trò</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin: any) => (
              <tr key={admin.id} className="border-b border-slate-50">
                <td className="px-6 py-4 text-sm font-mono">{admin.name}</td>

                <td className="px-6 py-4 text-sm font-mono">{admin.walletAddress}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${admin.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setEditingAdmin(admin);
                      setForm({
                        name: admin.name,
                        walletAddress: admin.walletAddress,
                        role: admin.role,
                        isActive: admin.isActive
                      });
                    }}
                    className="text-blue-500 text-xs font-bold mr-4 cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(admin.id)}
                    className="text-red-500 font-bold text-xs cursor-pointer">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}