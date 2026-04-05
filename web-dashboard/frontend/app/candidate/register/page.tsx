'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { publicApiService } from '@/services/public.service';

export default function RegisterCandidatePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên');
      return;
    }

    if (!file) {
      setError('Vui lòng chọn ảnh đại diện');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const walletAddress = localStorage.getItem('walletAddress');
      const studentId = localStorage.getItem('studentId');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('avatar', file);
      if (walletAddress && studentId) {
        formData.append('walletAddress', walletAddress);
        formData.append('studentId', studentId);
      }

      await publicApiService.registerCandidate(formData);

      alert('Đăng ký thành công!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-black mb-4 text-center uppercase">Đăng ký ứng viên</h2>

        {/* Avatar preview */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border shadow-sm mb-2">
            {file ? (
              <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No Image
              </div>
            )}
          </div>

          <label className="text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-600">
            Chọn ảnh
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Tên</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg p-2"
            placeholder="Nhập tên"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Giới thiệu</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows={3}
            placeholder="Giới thiệu bản thân..."
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>

        {/* Back */}
        <button onClick={() => router.back()} className="w-full mt-2 text-sm text-slate-500">
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
