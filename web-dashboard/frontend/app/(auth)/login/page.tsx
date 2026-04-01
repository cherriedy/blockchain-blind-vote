'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { adminService } from '@/lib/api';

export default function LoginPage() {
    const [studentId, setStudentId] = useState<string>('');
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [connecting, setConnecting] = useState<boolean>(false);
    const [msg, setMsg] = useState<{ type: string; text: string }>({ type: '', text: '' });
    const router = useRouter();

    const handleConnectMetaMask = async () => {
        if (!(window as any).ethereum) {
            setMsg({ type: 'error', text: 'Vui lòng cài đặt ví MetaMask để sử dụng tính năng này.' });
            return;
        }
        setConnecting(true);
        setMsg({ type: '', text: '' });
        try {
            await (window as any).ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            if (accounts.length > 0) {
                setWalletAddress(accounts[0].toLowerCase());
                setMsg({ type: 'success', text: 'Đã kết nối ví thành công!' });
            }
        } catch (err: any) {
            if (err.code !== 4001) {
                setMsg({ type: 'error', text: 'Kết nối MetaMask thất bại.' });
            }
        }
        setConnecting(false);
    };

    const handleSubmit = async () => {
        const trimmedStudentId = studentId.trim().toUpperCase();
        const trimmedWallet = walletAddress.trim().toLowerCase();

        if (!trimmedStudentId) {
            setMsg({ type: 'error', text: 'Vui lòng nhập Mã số sinh viên.' });
            return;
        }

        if (!trimmedWallet) {
            setMsg({ type: 'error', text: 'Vui lòng kết nối ví MetaMask trước.' });
            return;
        }

        try {
            setConnecting(true);
            const res = await adminService.getVoterById(trimmedStudentId);

            const voter = res.data;
        
            if (!voter) {
                setMsg({ type: 'error', text: 'Không tìm thấy cử tri.' });
                return;
            }

            if (voter.walletAddress.toLowerCase() !== trimmedWallet) {
                setMsg({ type: 'error', text: 'Ví không khớp với tài khoản.' });
                return;
            }

            if (!voter.isActive) {
                setMsg({ type: 'error', text: 'Tài khoản đã bị vô hiệu hóa.' });
                return;
            }

            localStorage.setItem('studentId', trimmedStudentId);
            localStorage.setItem('walletAddress', trimmedWallet);

            router.push('/dashboard');

        } catch (err: any) {
            if (err.response?.status === 404) {
                setMsg({ type: 'error', text: 'Cử tri không tồn tại.' });
            } else {
                setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
            }
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center font-sans p-6 selection:bg-blue-500/30">
            <div className="bg-[#0d0d0d] p-10 rounded-[2.5rem] border border-gray-800/50 w-full max-w-md shadow-[0_0_50px_-12px_rgba(37,99,235,0.15)] relative overflow-hidden group">
                {/* Decorative blobs */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 mb-6 group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-white text-center leading-none tracking-tighter uppercase italic">Truy cập Hệ thống</h1>
                        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Cổng bầu cử & khảo sát</p>
                    </div>

                    <div className="space-y-5">
                        {/* Student ID input */}
                        <div className="relative group/input">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-4 mb-2 block tracking-widest group-focus-within/input:text-blue-500 transition-colors">
                                Mã số sinh viên (Student ID)
                            </label>
                            <input
                                className="w-full p-5 bg-gray-900/50 rounded-2xl border-2 border-gray-800 text-white outline-none focus:border-blue-600 transition-all font-black text-lg placeholder:text-gray-700 shadow-inner"
                                placeholder="Nhập MSSV..."
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>

                        {/* Wallet Address — MetaMask only */}
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-4 mb-2 block tracking-widest">
                                Địa chỉ ví (Wallet Address)
                            </label>

                            {walletAddress ? (
                                /* Connected state */
                                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Đã kết nối</p>
                                        <p className="text-white font-mono text-xs truncate">{walletAddress}</p>
                                    </div>
                                    <button
                                        onClick={handleConnectMetaMask}
                                        disabled={connecting}
                                        title="Đổi ví"
                                        className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-orange-400 transition-colors shrink-0 disabled:opacity-50"
                                    >
                                        Đổi ví
                                    </button>
                                </div>
                            ) : (
                                /* Disconnected state */
                                <button
                                    onClick={handleConnectMetaMask}
                                    disabled={connecting}
                                    className="w-full flex items-center gap-4 p-5 bg-gray-900/50 border-2 border-gray-800 rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group/mm"
                                >
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover/mm:bg-orange-500/20 transition-colors">
                                        {connecting ? (
                                            <div className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-black text-sm uppercase tracking-wide">
                                            {connecting ? 'Đang kết nối...' : 'Kết nối MetaMask'}
                                        </p>
                                        <p className="text-gray-600 text-[10px] font-bold mt-0.5">Nhấn để chọn tài khoản từ ví</p>
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            className="group/btn relative w-full bg-blue-600 p-5 rounded-2xl font-black text-white hover:bg-blue-500 transition-all uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 overflow-hidden mt-2"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                Vào Bảng điều khiển
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:[animation:shimmer_1.5s_infinite]"></div>
                        </button>
                    </div>

                    {/* Message */}
                    {msg.text && (
                        <div className={`mt-6 p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            <div className={`w-2 h-2 rounded-full shrink-0 ${msg.type === 'error' ? 'bg-red-500' :
                                    msg.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}></div>
                            <p className="text-[11px] font-black uppercase tracking-tight leading-tight flex-1">{msg.text}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-gray-800/50 flex flex-col items-center gap-3">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter text-center">
                            Thông tin chỉ được lưu trên thiết bị của bạn — Không gửi đến máy chủ lúc đăng nhập.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                    @keyframes shimmer { 100% { transform: translateX(100%); } }
                `}</style>
        </div>
    );
}