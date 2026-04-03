import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';

type Admin = {
    id: string;
    name: string;
    walletAddress: string;
    role: string;
};

type AuditLog = {
    id: string;
    adminId: string;
    admin: Admin;
    action: string;
    targetType: string;
    targetId: string;
    details: any;
    createdAt: string;
    targetName: string;
};

export default function AuditLogManager() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchLogs = async (q?: string) => {
        setLoading(true);
        try {
            const res = await adminService.getAuditLogs(q);
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchLogs(search);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by action, target, or admin..."
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-4 text-left">Hành động</th>
                            <th className="px-6 py-4 text-left">Loại</th>
                            <th className="px-6 py-4 text-left">Tên</th>
                            <th className="px-6 py-4 text-left">Chi tiết</th>
                            <th className="px-6 py-4 text-left">Admin</th>
                            <th className="px-6 py-4 text-left">Thời gian</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-400">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-slate-50 transition duration-150"
                                >
                                    {/* ACTION */}
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                                            {log.action}
                                        </span>
                                    </td>

                                    {/* TYPE */}
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full font-medium ${log.targetType === "ELECTION"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-purple-100 text-purple-600"
                                                }`}
                                        >
                                            {log.targetType}
                                        </span>
                                    </td>

                                    {/* NAME */}
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {log.targetName}
                                    </td>

                                    {/* DETAILS */}
                                    <td className="px-6 py-4 max-w-[300px]">
                                        <details className="group">
                                            <summary className="cursor-pointer text-blue-500 text-xs">
                                                Xem chi tiết
                                            </summary>
                                            <pre className="mt-2 text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto border">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </details>
                                    </td>

                                    {/* ADMIN */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-700">
                                            {log.admin?.name || "N/A"}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate max-w-[160px]">
                                            {log.admin?.walletAddress}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {log.admin?.role}
                                        </div>
                                    </td>

                                    {/* TIME */}
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}