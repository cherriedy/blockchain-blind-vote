'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ethers } from 'ethers';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ─── RSA Blind Signature Math (BigInt) ────────────────────────────────────────

/** Fast modular exponentiation: base^exp mod mod */
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}

/** Extended Euclidean Algorithm — returns [gcd, x, y] where ax + by = gcd */
function extGcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
    if (b === 0n) return [a, 1n, 0n];
    const [g, x1, y1] = extGcd(b, a % b);
    return [g, y1, x1 - (a / b) * y1];
}

/** Modular inverse of a mod n (throws if gcd ≠ 1) */
function modInverse(a: bigint, n: bigint): bigint {
    const [g, x] = extGcd(((a % n) + n) % n, n);
    if (g !== 1n) throw new Error('modInverse: not invertible');
    return ((x % n) + n) % n;
}

/** Generate a random BigInt in range [2, n-1] that is coprime with n */
function randomBlindingFactor(n: bigint): bigint {
    const bytes = new Uint8Array(256); // 2048-bit
    do {
        crypto.getRandomValues(bytes);
        bytes[0] |= 0x80; // Ensure top bit set so r ~ n in size
        const r = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        const candidate = r % n;
        if (candidate > 1n) {
            const [g] = extGcd(candidate, n);
            if (g === 1n) return candidate;
        }
    } while (true);
}

/** Generate 32 random bytes as a BigInt and its 0x-prefixed hex string */
function randomMessage(): { bigint: bigint; hex: string } {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const hex = '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return { bigint: BigInt(hex), hex };
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** Steps: idle → verifying → verified → voting → success | error */
function VotePage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ── URL params ──
    const [voteType, setVoteType] = useState<string>('');  // 'election' | 'poll'
    const [voteId, setVoteId] = useState<string>('');

    // ── User credentials ──
    const [studentId, setStudentId] = useState<string>('');
    const [walletAddress, setWalletAddress] = useState<string>('');

    // ── Event data ──
    const [event, setEvent] = useState<any>(null);
    const [candidates, setCandidates] = useState<any>({ assigned: [], selfNominated: [] });

    // ── Real-time vote counts ──
    const [optionVotes, setOptionVotes] = useState<Record<number, number>>({});    // { [optionIndex]: count }
    const [candidateVotes, setCandidateVotes] = useState<Record<string, number>>({}); // { [candidateId]: count }
    // const socketRef = useRef(null); // [TẠM BỎ WEBSOCKET]

    // ── Selection ──
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

    // ── Flow state ──
    const [step, setStep] = useState<'idle' | 'verifying' | 'verified' | 'voting' | 'success' | 'error'>('idle'); // idle | verifying | verified | voting | success | error
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [txHash, setTxHash] = useState<string>('');

    // ─── Load event on mount ───────────────────────────────────────────────────
    useEffect(() => {
        const sid = localStorage.getItem('studentId');
        const wallet = localStorage.getItem('walletAddress');

        if (!sid || !wallet) {
            router.replace('/login');
            return;
        }

        setStudentId(sid);
        setWalletAddress(wallet);

        const qt = searchParams.get('voteType');
        const qid = searchParams.get('voteId');
        
        if (!qt || !qid) {
            router.replace('/dashboard');
            return;
        }

        setVoteType(qt);
        setVoteId(qid);
        fetchEvent(qt, qid);
    }, [router, searchParams]);

    const fetchEvent = useCallback(async (type: string, id: string) => {
        setLoading(true);
        try {
            if (type === 'election') {
                const [eventRes, candidatesRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/elections/${id}`),
                    axios.get(`${BACKEND_URL}/api/elections/${id}/candidates`),
                ]);
                setEvent(eventRes.data);
                const cands = candidatesRes.data ?? { assigned: [], selfNominated: [] };
                setCandidates(cands);
                // Fetch initial vote counts for all candidates
                const allCands = [...(cands.assigned ?? []), ...(cands.selfNominated ?? [])];
                const counts = await Promise.all(
                    allCands.map((c: any) =>
                        axios.get(`${BACKEND_URL}/api/voting/election/${id}/votes/${c.id}`)
                            .then((r: any) => [c.id, Number(r.data.count)])
                            .catch(() => [c.id, 0])
                    )
                );
                setCandidateVotes(Object.fromEntries(counts));
            } else {
                const res = await axios.get(`${BACKEND_URL}/api/polls/${id}`);
                setEvent(res.data);
                // Fetch initial vote counts for all options
                const opts = res.data.options ?? [];
                const counts = await Promise.all(
                    opts.map((_: any, idx: number) =>
                        axios.get(`${BACKEND_URL}/api/voting/poll/${id}/votes/${idx}`)
                            .then((r: any) => [idx, Number(r.data.count)])
                            .catch(() => [idx, 0])
                    )
                );
                setOptionVotes(Object.fromEntries(counts));
            }
            setStep('idle');
        } catch (err: any) {
            setErrorMsg('Không thể tải thông tin cuộc bầu chọn. Vui lòng quay lại.');
            setStep('error');
        }
        setLoading(false);
    }, []);

    // ─── WebSocket: join event room and receive real-time vote updates ────────
    // useEffect(() => {
    //     if (!voteId || !voteType) return;
    //
    //     const socket = io(`${BACKEND_URL}/voting`, { transports: ['websocket'] });
    //     socketRef.current = socket;
    //
    //     socket.on('connect', () => {
    //         socket.emit('join', { voteType, voteId });
    //     });
    //
    //     socket.on('vote:update', (data) => {
    //         if (data.voteType === 'election' && data.candidateId !== undefined) {
    //             setCandidateVotes(prev => ({ ...prev, [data.candidateId]: data.newTotal }));
    //         } else if (data.voteType === 'poll' && data.optionIndex !== undefined) {
    //             setOptionVotes(prev => ({ ...prev, [data.optionIndex]: data.newTotal }));
    //         }
    //     });
    //
    //     return () => {
    //         socket.disconnect();
    //         socketRef.current = null;
    //     };
    // }, [voteId, voteType]); // [TẠM BỎ WEBSOCKET]

    // ─── Step 1: Verify identity via MetaMask challenge ───────────────────────
    const handleVerifyIdentity = async () => {
        if (!(window as any).ethereum) {
            setErrorMsg('Vui lòng cài MetaMask để sử dụng chức năng bỏ phiếu.');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            // Request challenge nonce from backend
            const challengeRes = await axios.post(`${BACKEND_URL}/api/voting/challenge`, {
                studentId,
                walletAddress,
                voteType,
                voteId,
            });
            const challengeData = challengeRes.data;
            if (challengeData.verified) {
                // Already verified, skip signing
                setStep('verified');
                setLoading(false);
                return;
            }
            const { message: challengeMessage } = challengeData;

            // Sign the challenge with MetaMask (personal_sign = EIP-191)
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            const signerAddress = accounts[0].toLowerCase();

            if (signerAddress !== walletAddress.toLowerCase()) {
                throw new Error(
                    `Ví đang kết nối (${signerAddress.slice(0, 6)}...) khác với ví đã đăng ký (${walletAddress.slice(0, 6)}...). Vui lòng chuyển đúng ví.`
                );
            }

            const signer = await provider.getSigner();
            const signature = await signer.signMessage(challengeMessage);

            // Verify signature on backend — marks ballotRequest.isChallenged = true
            await axios.post(`${BACKEND_URL}/api/voting/verify-challenge`, {
                studentId,
                walletAddress,
                signature,
                voteType,
                voteId,
            });

            setStep('verified');
        } catch (err: any) {
            const isUserRejected =
                err?.code === 4001 ||
                err?.error?.code === 4001 ||
                err?.reason === 'rejected' ||
                (typeof err?.message === 'string' && (
                    err.message.includes('ethers-user-denied') ||
                    err.message.includes('User rejected')
                ));
            if (isUserRejected) {
                setErrorMsg('Bạn đã huỷ ký xác thực. Vui lòng thử lại.');
            } else {
                const msg = err?.response?.data?.message || err.message || 'Xác thực thất bại.';
                setErrorMsg(msg);
            }
        }
        setLoading(false);
    };

    // ─── Step 2: Blind → sign → unblind → cast ───────────────────────────────
    const handleCastVote = async () => {
        const isElection = voteType === 'election';

        if (isElection && !selectedCandidateId) {
            setErrorMsg('Vui lòng chọn một ứng viên.');
            return;
        }
        if (!isElection && selectedOptionIndex === null) {
            setErrorMsg('Vui lòng chọn một phương án.');
            return;
        }

        setLoading(true);
        setStep('voting');
        setErrorMsg('');
        try {
            // 1. Fetch RSA public key
            const pkRes = await axios.get(`${BACKEND_URL}/api/voting/public-key`, {
                params: { voteType, voteId },
            });
            const n = BigInt('0x' + pkRes.data.n);
            const e = BigInt('0x' + pkRes.data.e);

            // 2. Generate random message (32 bytes) and blinding factor r
            const { bigint: msgBigInt, hex: msgHex } = randomMessage();
            const r = randomBlindingFactor(n);

            // 3. Blind: blinded = msg * r^e mod n
            const rPowE = modPow(r, e, n);
            const blinded = (msgBigInt * rPowE) % n;
            const blindedHex = '0x' + blinded.toString(16).padStart(512, '0');

            // 4. Request blind signature from backend
            const blindRes = await axios.post(`${BACKEND_URL}/api/voting/blind`, {
                studentId,
                blindedMessage: blindedHex,
                voteType,
                voteId,
            });
            const blindSigBigInt = BigInt(blindRes.data.blindSignature);

            // 5. Unblind: sig = blindSig * r^-1 mod n
            const rInv = modInverse(r, n);
            const sigBigInt = (blindSigBigInt * rInv) % n;
            const sigHex = '0x' + sigBigInt.toString(16).padStart(512, '0');

            // 6. Cast vote via backend (backend submits to blockchain)
            const castPayload = {
                voteType,
                voteId,
                message: msgHex,
                signature: sigHex,
                ...(isElection
                    ? { candidateId: selectedCandidateId }
                    : { optionIndex: selectedOptionIndex }),
            };

            const castRes = await axios.post(`${BACKEND_URL}/api/voting/cast`, castPayload);
            setTxHash(castRes.data.txHash);
            setStep('success');
        } catch (err: any) {
            const isUserRejected =
                err?.code === 4001 ||
                err?.error?.code === 4001 ||
                err?.reason === 'rejected' ||
                (typeof err?.message === 'string' && (
                    err.message.includes('ethers-user-denied') ||
                    err.message.includes('User rejected')
                ));
            if (isUserRejected) {
                setErrorMsg('Bạn đã huỷ ký xác thực. Vui lòng thử lại.');
            } else {
                let msg = err?.response?.data?.message || err.message || 'Lỗi không xác định';
                if (msg === 'A blind signature has already been issued for this voter and voting event.') {
                    msg = 'Bạn đã thực hiện bỏ phiếu cho sự kiện này. Không thể bỏ phiếu thêm lần nữa.';
                }
                setErrorMsg(msg);
                setStep('verified'); // Allow retry selection
            }
        }
        setLoading(false);
    };

    // ─── Derived ──────────────────────────────────────────────────────────────
    const allCandidates = [
        ...(candidates.assigned ?? []),
        ...(candidates.selfNominated ?? []),
    ];

    const isActive = event?.status === 'active';
    const isElection = voteType === 'election';

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="vote-page min-h-screen bg-slate-50 text-slate-900">
                {/* ── Header ── */}
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-[10px] font-black uppercase tracking-widest"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại
                        </button>
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{studentId}</span>
                        </div>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">

                    {/* ── Loading state ── */}
                    {loading && step === 'idle' && (
                        <div className="h-64 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải...</p>
                        </div>
                    )}

                    {/* ── Error state ── */}
                    {step === 'error' && (
                        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center">
                            <p className="text-sm font-bold text-red-600 mb-4">{errorMsg}</p>
                            <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                Về trang chủ
                            </button>
                        </div>
                    )}

                    {/* ── Success state ── */}
                    {step === 'success' && (
                        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center animate-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">Bỏ phiếu thành công!</h2>
                            <p className="text-sm text-slate-500 font-medium mb-8 italic">Lá phiếu nặc danh của bạn đã được ghi nhận trên Blockchain.</p>

                            {txHash && (
                                <div className="bg-slate-50 rounded-2xl p-5 mb-8 text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction Hash</p>
                                    <p className="font-mono text-xs text-slate-700 break-all">{txHash}</p>
                                </div>
                            )}

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Về trang chủ
                            </button>
                        </div>
                    )}

                    {/* ── Main voting flow ── */}
                    {event && step !== 'success' && step !== 'error' && (
                        <>
                            {/* Event info card */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isElection ? 'text-blue-600' : 'text-indigo-600'}`}>
                                        {isElection ? 'Cuộc bầu cử' : 'Khảo sát'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                        isActive
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        {event.status}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                                    {event.name}
                                </h1>
                                {event.description && (
                                    <p className="text-slate-500 text-sm leading-relaxed italic border-l-4 border-slate-200 pl-4">
                                        {event.description}
                                    </p>
                                )}
                            </div>

                            {/* Not active warning */}
                            {!isActive && (
                                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                                    <p className="text-sm font-bold text-amber-700">Cuộc bầu chọn này hiện không đang diễn ra (trạng thái: <strong>{event.status}</strong>).</p>
                                </div>
                            )}

                            {isActive && (
                                <>
                                    {/* ── STEP 1: Verify Identity ── */}
                                    {(step === 'idle') && (
                                        <div className="bg-white border-2 border-slate-900 rounded-[1.5rem] p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                                            <div className="flex items-start gap-4 mb-6">
                                                <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">1</div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Xác thực danh tính</h3>
                                                    <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                                                        Ký xác thực bằng ví MetaMask đã đăng ký (<span className="font-mono text-blue-600">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span>) để chứng minh tư cách cử tri. Chữ ký này <strong>không phí gas</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                            {errorMsg && (
                                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
                                                    {errorMsg}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleVerifyIdentity}
                                                disabled={loading}
                                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Đang xử lý...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Xác thực danh tính với MetaMask
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* ── STEP 2: Select & Vote ── */}
                                    {step === 'verified' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* Identity confirmed badge */}
                                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                                                <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <p className="text-[11px] font-black text-green-700 uppercase tracking-widest">Danh tính đã được xác thực</p>
                                            </div>

                                            <div className="bg-white border-2 border-slate-900 rounded-[1.5rem] p-8 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
                                                <div className="flex items-start gap-4 mb-6">
                                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">2</div>
                                                    <div>
                                                        <h3 className="font-black text-slate-900 uppercase tracking-tight">
                                                            {isElection ? 'Chọn ứng viên' : 'Chọn phương án'}
                                                        </h3>
                                                        <p className="text-[11px] text-slate-500 font-medium mt-1">Lá phiếu được mã hoá nặc danh trước khi gửi. Không ai có thể biết bạn chọn ai.</p>
                                                    </div>
                                                </div>

                                                {/* Election candidates */}
                                                {isElection && (
                                                    <div className="space-y-3">
                                                        {allCandidates.length === 0 ? (
                                                            <p className="text-center text-slate-400 italic text-sm py-8">Chưa có ứng viên nào.</p>
                                                        ) : (() => {
                                                            const totalCandidateVotes = Object.values(candidateVotes).reduce((a, b) => a + b, 0);
                                                            return allCandidates.map((c) => {
                                                                const count = candidateVotes[c.id] ?? 0;
                                                                const pct = totalCandidateVotes > 0 ? Math.round((count / totalCandidateVotes) * 100) : 0;
                                                                return (
                                                                    <button
                                                                        key={c.id}
                                                                        onClick={() => setSelectedCandidateId(c.id)}
                                                                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                                                                            selectedCandidateId === c.id
                                                                                ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                                                                                : 'border-slate-100 bg-slate-50 hover:border-blue-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                                                selectedCandidateId === c.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                                                            }`}>
                                                                                {selectedCandidateId === c.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className="font-black text-slate-900 uppercase tracking-tight mb-0.5">{c.name}</p>
                                                                                {c.bio && <p className="text-[11px] text-slate-500 mb-1.5">{c.bio}</p>}
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-xs font-bold text-slate-600">{count.toLocaleString()} phiếu</span>
                                                                                    <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                                                                                </div>
                                                                                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                )}

                                                {/* Poll options */}
                                                {!isElection && event.options && (
                                                    <div className="space-y-3">
                                                        {(() => {
                                                            const totalOptionVotes = Object.values(optionVotes).reduce((a: number, b: number) => a + b, 0);
                                                            return event.options.map((opt: string, idx: number) => {
                                                                const count = optionVotes[idx] ?? 0;
                                                                const pct = totalOptionVotes > 0 ? Math.round((count / totalOptionVotes) * 100) : 0;
                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        onClick={() => setSelectedOptionIndex(idx)}
                                                                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                                                                            selectedOptionIndex === idx
                                                                                ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                                                                                : 'border-slate-100 bg-slate-50 hover:border-indigo-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                                                selectedOptionIndex === idx ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                                                                            }`}>
                                                                                {selectedOptionIndex === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <p className="font-bold text-slate-900 mb-1.5">{opt}</p>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="text-xs font-bold text-slate-600">{count.toLocaleString()} phiếu</span>
                                                                                    <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                                                                                </div>
                                                                                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {errorMsg && (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm font-medium text-red-600">
                                                    {errorMsg}
                                                </div>
                                            )}

                                            <button
                                                onClick={handleCastVote}
                                                disabled={loading || (isElection ? !selectedCandidateId : selectedOptionIndex === null)}
                                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Đang gửi phiếu bầu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Xác nhận bỏ phiếu nặc danh
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-center text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">
                                                Lá phiếu được mã hoá RSA Blind Signature • Không thể sửa sau khi gửi
                                            </p>
                                        </div>
                                    )}

                                    {/* ── STEP voting (processing) ── */}
                                    {step === 'voting' && (
                                        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center shadow-sm">
                                            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Đang xử lý lá phiếu</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Mã hoá nặc danh & gửi lên Blockchain...</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
    );
}

export default VotePage;
