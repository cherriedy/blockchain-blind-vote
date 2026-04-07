'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';
import { publicApiService } from '@/services/public.service';

export default function LoginPage() {
  const [studentId, setStudentId] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const router = useRouter();

  const redirectAfterLogin = async (studentIdVal: string, walletVal: string) => {
    localStorage.setItem('studentId', studentIdVal);
    localStorage.setItem('walletAddress', walletVal);

    try {
      const meRes = await adminService.getMe();
      if (meRes?.data && meRes.data.role) {
        try {
          router.replace('/admin');
        } catch (e) {
          window.location.href = '/admin';
        }
      } else {
        try {
          router.replace('/dashboard');
        } catch (e) {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      try {
        router.replace('/dashboard');
      } catch (e) {
        window.location.href = '/dashboard';
      }
    }
  };

  // Modified: Let user select address in wallet instead of returning the first one
  const connectWalletIfNeeded = async (): Promise<string> => {
    if (!(window as any).ethereum) {
      throw new Error('NO_METAMASK');
    }

    await (window as any).ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    // Prompt user to select an account
    const accounts = await provider.send('eth_requestAccounts', []);
    if (!accounts || accounts.length === 0) {
      throw new Error('NO_ACCOUNTS');
    }
    // If multiple accounts, prompt user to select one
    let selectedAccount = accounts[0];
    if (accounts.length > 1) {
      selectedAccount =
        window.prompt(
          `Chọn địa chỉ ví để đăng nhập:\n${accounts.map((a: string, i: number) => `${i + 1}: ${a}`).join('\n')}`,
          accounts[0],
        ) || accounts[0];
      if (!accounts.includes(selectedAccount)) {
        selectedAccount = accounts[0];
      }
    }
    return selectedAccount.toLowerCase();
  };

  const handleSubmit = async () => {
    const trimmedStudentId = studentId.trim().toUpperCase();
    const trimmedWallet = walletAddress.trim().toLowerCase();

    if (!trimmedStudentId) {
      setMsg({ type: 'error', text: 'Vui lòng nhập Mã số sinh viên.' });
      return;
    }

    // If wallet not connected yet, try to connect automatically so the user
    // only needs to click the main button once.
    let finalWallet = trimmedWallet;
    if (!finalWallet) {
      setMsg({ type: '', text: 'Kết nối ví MetaMask, vui lòng xác nhận...' });
      try {
        const addr = await connectWalletIfNeeded();
        finalWallet = addr;
        setWalletAddress(addr);
        setMsg({ type: 'success', text: 'Đã kết nối ví thành công!' });
      } catch (err: any) {
        if (err?.message === 'NO_METAMASK') {
          setMsg({ type: 'error', text: 'Vui lòng cài đặt ví MetaMask để sử dụng tính năng này.' });
        } else if (err?.code === 4001) {
          setMsg({ type: 'error', text: 'Bạn đã từ chối kết nối ví. Vui lòng thử lại.' });
        } else {
          setMsg({ type: 'error', text: 'Kết nối MetaMask thất bại.' });
        }
        return;
      }
    }

    try {
      // 1) Fetch voter and basic checks
      const res = await publicApiService.getVoterById(trimmedStudentId);
      const voter = res.data;

      if (!voter) {
        setMsg({ type: 'error', text: 'Không tìm thấy cử tri.' });
        return;
      }

      if (voter.walletAddress.toLowerCase() !== finalWallet) {
        setMsg({ type: 'error', text: 'Ví không khớp với tài khoản.' });
        return;
      }

      if (!voter.isActive) {
        setMsg({ type: 'error', text: 'Tài khoản đã bị vô hiệu hóa.' });
        return;
      }

      // 2) Request eligibility challenge (nonce + message)
      setMsg({ type: '', text: 'Yêu cầu xác thực, vui lòng ký tin nhắn trên ví.' });
      const challengeRes = await authService.createEligibilityChallenge(
        trimmedStudentId,
        finalWallet,
      );
      const challengeData = challengeRes.data;

      // If backend reports already verified, skip signing
      if ((challengeData as any).verified) {
        setMsg({ type: 'success', text: 'Đã xác thực trước đó. Chuyển hướng...' });
        await redirectAfterLogin(trimmedStudentId, finalWallet);
        return;
      }

      const message = (challengeData as any).message;
      if (!message) {
        setMsg({ type: 'error', text: 'Không nhận được thông tin xác thực từ máy chủ.' });
        return;
      }

      // 3) Ask user to sign the challenge message with their wallet
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      let signature: string;
      try {
        signature = await signer.signMessage(message);
      } catch (err: any) {
        // user rejected signature or other wallet error
        if (err?.code === 4001) {
          setMsg({ type: 'error', text: 'Bạn đã từ chối ký. Vui lòng ký để tiếp tục.' });
        } else {
          setMsg({ type: 'error', text: 'Lỗi khi yêu cầu ký từ ví.' });
        }
        return;
      }

      // 4) Verify signature with backend
      setMsg({ type: '', text: 'Xác thực chữ ký...' });
      const verifyRes = await authService.verifyEligibilitySignature(
        trimmedStudentId,
        finalWallet,
        signature,
      );
      const verifyData = verifyRes.data;

      // Accept different truthy forms from backend and also `verified` field.
      const isValid =
        !!verifyData &&
        ((verifyData as any).valid === true ||
          (verifyData as any).valid === 'true' ||
          (verifyData as any).verified === true ||
          (verifyData as any).verified === 'true');

      if (isValid) {
        setMsg({ type: 'success', text: 'Xác thực thành công, chuyển hướng...' });
        await redirectAfterLogin(trimmedStudentId, finalWallet);
        return;
      } else {
        setMsg({ type: 'error', text: 'Xác thực thất bại. Vui lòng thử lại.' });
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setMsg({ type: 'error', text: 'Cử tri không tồn tại.' });
      } else if (err.response?.data?.message) {
        setMsg({ type: 'error', text: err.response.data.message });
      } else {
        setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans p-6 selection:bg-blue-500/30">
      <div className="bg-[#0d0d0d] p-10 rounded-[2.5rem] border border-gray-800/50 w-full max-w-md shadow-[0_0_50px_-12px_rgba(37,99,235,0.15)] relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700"></div>

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-linear-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 mb-6 group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
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
            <h1 className="text-3xl font-black text-white text-center leading-none tracking-tighter uppercase italic">
              Truy cập Hệ thống
            </h1>
            <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
              Cổng bầu cử & khảo sát
            </p>
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
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              className="group/btn relative w-full bg-blue-600 p-5 rounded-2xl font-black text-white hover:bg-blue-500 transition-all uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 active:scale-95 overflow-hidden mt-2"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Vào Bảng điều khiển
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
            </button>
          </div>

          {/* Message */}
          {msg.text && (
            <div
              className={`mt-6 p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${
                msg.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : msg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  msg.type === 'error'
                    ? 'bg-red-500'
                    : msg.type === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-blue-500'
                }`}
              ></div>
              <p className="text-[11px] font-black uppercase tracking-tight leading-tight flex-1">
                {msg.text}
              </p>
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
