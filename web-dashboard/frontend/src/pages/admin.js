import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { CONTRACT_ADDRESS, ABI } from "@/constants";
import Head from "next/head";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// export default function AdminDashboard() {
//   const [account, setAccount] = useState("");
//   const [requests, setRequests] = useState([]);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [isVotingActive, setIsVotingActive] = useState(false);
//   const [electionStats, setElectionStats] = useState({
//     title: "",
//     totalVoted: 0,
//     totalApproved: 0,
//     candidates: [],
//   });
//   const [approvedList, setApprovedList] = useState([]);
//   const [allApprovedList, setAllApprovedList] = useState([]);
//   const [electionHistory, setElectionHistory] = useState([]);
//   const [expandedHistoryId, setExpandedHistoryId] = useState(null);
//
//   // Form tạo bầu chọn
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [candidates, setCandidates] = useState("");
//   const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
//   const [endDate, setEndDate] = useState(""); // YYYY-MM-DD
//   const [isAutoMode, setIsAutoMode] = useState(false);
//
//   // UI/UX States
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [remainingTime, setRemainingTime] = useState(null);
//   const [activeTab, setActiveTab] = useState("voting"); // voting, history, requests
//
//   // Voter Modal States
//   const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
//   const [selectedElectionVoters, setSelectedElectionVoters] = useState([]);
//   const [voterSearchQuery, setVoterSearchQuery] = useState("");
//   const [voterCurrentPage, setVoterCurrentPage] = useState(1);
//   const VOTERS_PER_PAGE = 5;
//
//   // Description Modal States
//   const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
//   const [selectedDescription, setSelectedDescription] = useState("");
//   const [selectedElectionCandidates, setSelectedElectionCandidates] = useState(
//     [],
//   );
//
//   // Management Tab States (for already approved)
//   const [managementSearchQuery, setManagementSearchQuery] = useState("");
//   const [managementCurrentPage, setManagementCurrentPage] = useState(1);
//   const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
//
//   // Error Modal State
//   const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
//   const [errorModalMsg, setErrorModalMsg] = useState("");
//
//   const connectWallet = async () => {
//     if (!window.ethereum)
//       return alert("Vui lòng cài đặt ví MetaMask để truy cập bảng điều khiển.");
//
//     // Xóa trạng thái cũ trước khi kết nối lại
//     setIsAdmin(false);
//     setAccount("");
//
//     try {
//       // Yêu cầu MetaMask hiển bảng chọn tài khoản để tránh kết nối nhầm ví
//       await window.ethereum.request({
//         method: "wallet_requestPermissions",
//         params: [{ eth_accounts: {} }],
//       });
//
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const accounts = await provider.send("eth_requestAccounts", []);
//       const addr = accounts[0].toLowerCase();
//
//       if (addr === ADMIN_ADDRESS) {
//         setAccount(addr);
//         setIsAdmin(true);
//         fetchRequests();
//       } else {
//         setErrorModalMsg(
//           "Ví kết nối (" +
//             addr.substring(0, 6) +
//             "..." +
//             addr.substring(38) +
//             ") không có quyền quản trị. Vui lòng chuyển sang ví Admin.",
//         );
//         setIsErrorModalOpen(true);
//       }
//     } catch (err) {
//       console.error("Login Error:", err);
//     }
//   };
//
//   useEffect(() => {
//     const checkInitialAdmin = async () => {
//       if (typeof window !== "undefined" && window.ethereum) {
//         const accounts = await window.ethereum.request({
//           method: "eth_accounts",
//         });
//         if (
//           accounts.length > 0 &&
//           accounts[0].toLowerCase() === ADMIN_ADDRESS
//         ) {
//           setAccount(accounts[0].toLowerCase());
//           setIsAdmin(true);
//           fetchRequests();
//         }
//       }
//     };
//     checkInitialAdmin();
//
//     if (typeof window !== "undefined" && window.ethereum) {
//       window.ethereum.on("accountsChanged", (accounts) => {
//         if (
//           accounts.length > 0 &&
//           accounts[0].toLowerCase() === ADMIN_ADDRESS
//         ) {
//           setAccount(accounts[0].toLowerCase());
//           setIsAdmin(true);
//           setIsErrorModalOpen(false);
//           fetchRequests();
//         } else if (accounts.length > 0) {
//           setAccount("");
//           setIsAdmin(false);
//           setErrorModalMsg(
//             "Ví vừa chuyển không có quyền Admin. Vui lòng kết nối lại đúng ví.",
//           );
//           setIsErrorModalOpen(true);
//         } else {
//           setAccount("");
//           setIsAdmin(false);
//         }
//       });
//     }
//   }, []);
//
//   useEffect(() => {
//     let timer;
//     if (isVotingActive && remainingTime !== null) {
//       timer = setInterval(() => {
//         setRemainingTime((prev) => {
//           if (prev !== null && prev <= 0) {
//             return 0;
//           }
//           return prev !== null ? prev - 1 : null;
//         });
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [isVotingActive, remainingTime]);
//
//   const fetchRequests = async () => {
//     try {
//       // Get all voters and filter inactive ones (pending approval)
//       const votersRes = await axios.get(`${BACKEND_URL}/voters`, {
//         headers: { "x-admin-wallet-address": account },
//       });
//       const pendingVoters = votersRes.data.filter((v) => !v.isActive);
//             const res = await axios.get(`${BACKEND_URL}/api/admin/requests`);
//             setRequests(res.data);
//
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
//       const active = await contract.isVotingActive();
//       setIsVotingActive(active);
//
//       if (active) {
//         const eId = await contract.currentElectionId();
//
//         // Get election info from Prisma
//         const electionRes = await axios.get(
//           `${BACKEND_URL}/events/election/${eId}`,
//           { headers: { "x-admin-wallet-address": account } },
//         );
//                 const info = await axios.get(`${BACKEND_URL}/api/election-info/${eId}`);
//
//
//                 if (info.data.isAutoMode && info.data.endDate) {
//                     const diff = Math.floor((Number(info.data.endDate) - Date.now()) / 1000);
//                     setRemainingTime(diff > 0 ? diff : 0);
//                 } else if (info.data && info.data.endTimestamp) {
//                     const diff = Math.floor((Number(info.data.endTimestamp) - Date.now()) / 1000);
//         if (info.endDate) {
//           const diff = Math.floor(
//             (Number(new Date(info.endDate).getTime()) - Date.now()) / 1000,
//           );
//           setRemainingTime(diff > 0 ? diff : 0);
//         }
//
//         const [title, candidates] = await contract.getResults(eId);
//         let totalVoted = 0;
//         const formattedCandidates = candidates.map((c) => {
//           const votes = Number(c.voteCount);
//           totalVoted += votes;
//           return { name: c.name, voteCount: votes };
//         });
//
//         // Count active voters for this election
//         const activeVoters = votersRes.data.filter((v) => v.isActive);
//                 const countRes = await axios.get(`${BACKEND_URL}/api/admin/approved-count/${eId}`);
//
//         setElectionStats({
//           title,
//           totalVoted,
//           totalApproved: countRes,
//           candidates: formattedCandidates,
//           endDate: info.endDate,
//           description: info.description,
//         });
//
//                 const listRes = await axios.get(`${BACKEND_URL}/api/admin/approved-list/${eId}`);
//                 setApprovedList(listRes.data);
//         setApprovedList(activeVoters);
//       }
//
//       // Get all active voters for management
//       const allApproveRes = votersRes.data.filter((v) => v.isActive);
//       setAllApprovedList(allApproveRes);
//
//       // Get election history from events
//       const historyRes = await axios.get(`${BACKEND_URL}/events`, {
//         headers: { "x-admin-wallet-address": account },
//       });
//
//       // Format history data
//       const formattedHistory = await Promise.all(
//         historyRes.data.map(async (event) => {
//           const eventVoters = votersRes.data.filter(
//             (v) => v.electionId === event.id && v.isActive,
//           );
//           return {
//             title: event.title,
//             description: event.description,
//             candidates: event.candidates || [],
//             totalVoted: 0, // Will be filled from blockchain
//             winner: "---",
//             participants: eventVoters.map((v) => v.studentId),
//           };
//         }),
//       );
//
//       setElectionHistory(formattedHistory);
//     } catch (error) {
//       console.error(error);
//     }
//   };
//
//   const handleCreateElection = async () => {
//     try {
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
//
//       const names = candidates
//         .split(",")
//         .map((n) => n.trim())
//         .filter((n) => n !== "");
//       if (!title.trim()) return alert("Thiếu tiêu đề!");
//       if (names.length < 2)
//         return alert(
//           "Hệ thống yêu cầu tối thiểu 2 ứng cử viên để bắt đầu đợt bầu cử.",
//         );
//
//       setIsProcessing(true);
//
//       // Gửi giao dịch lên Blockchain để khởi tạo kỳ bầu cử mới
//       const tx = await contract.startNewElection(title, names);
//       setIsProcessing(false);
//
//       // Cập nhật giao diện ngay lập tức (Optimistic UI) không đợi Blockchain xác nhận
//       // Reset form
//       setTitle("");
//       setCandidates("");
//       setDescription("");
//       setStartDate("");
//       setEndDate("");
//       setIsAutoMode(false);
//       setActiveTab("voting");
//       fetchRequests();
//
//       // Chờ xác nhận từ Blockchain ở nền, cập nhật UI sau khi giao dịch được mining
//       tx.wait()
//         .then(async () => {
//           setIsVotingActive(true);
//           fetchRequests();
//         })
//         .catch(async (e) => {
//           console.error("Create election tx failed:", e);
//           fetchRequests();
//         });
//     } catch (err) {
//       console.error("Start election error:", err);
//       alert("Lỗi: " + (err.reason || err.message));
//     } finally {
//       setIsProcessing(false);
//     }
//   };
//
//   const handleApprove = async (mssv, wallet) => {
//     if (isVotingActive)
//       return alert("Không thể thao tác khi hệ thống thông bỏ phiếu đang mở.");
//     try {
//       await axios.patch(
//         `${BACKEND_URL}/voters/${mssv}/status`,
//         { isActive: true },
//         { headers: { "x-admin-wallet-address": account } },
//       );
//       alert("Duyệt quyền bầu cử thành công.");
//       fetchRequests();
//     } catch (error) {
//       alert(error.response?.data?.message || "Lỗi khi duyệt");
//     }
//   };
//
//   const handleRemove = async (mssv) => {
//     if (isVotingActive) return alert("Đang bầu cử, không được xóa!");
//     if (!confirm(`Bạn có chắc muốn XÓA sinh viên ${mssv} khỏi hệ thống không?`))
//       return;
//
//     try {
//       await axios.delete(`${BACKEND_URL}/voters/${mssv}`, {
//         headers: { "x-admin-wallet-address": account },
//       });
//       alert("Đã xóa sinh viên!");
//       fetchRequests();
//     } catch (error) {
//       alert(error.response?.data?.message || "Lỗi khi xóa");
//     }
//   };
//
//   const handleResetAll = async () => {
//     if (isVotingActive)
//       return alert(
//         "Hệ thống khóa chức năng này để bảo vệ dữ liệu trong thời gian bầu cử!",
//       );
//     if (
//       !confirm(
//         "⚠️ CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ danh sách sinh viên hiện tại. Bạn có chắc chắn không?",
//       )
//     )
//       return;
//     try {
//       // Delete all voters with admin header
//       const voters = await axios.get(`${BACKEND_URL}/voters`, {
//         headers: { "x-admin-wallet-address": account },
//       });
//
//       // Delete each voter
//       for (const voter of voters.data) {
//         await axios.delete(`${BACKEND_URL}/voters/${voter.studentId}`, {
//           headers: { "x-admin-wallet-address": account },
//         });
//       }
//
//       alert("Hoàn tất xóa dữ liệu cử tri.");
//       fetchRequests();
//     } catch (error) {
//       alert(error.response?.data?.error || "Lỗi hệ thống khi reset");
//     }
//   };
//
//   const handleEndElection = async () => {
//     try {
//       setIsProcessing(true);
//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
//
//       const tx = await contract.endVoting();
//       setIsProcessing(false);
//
//       // Cập nhật giao diện ngay lập tức (Optimistic UI) không đợi Blockchain xác nhận
//       localStorage.removeItem("currentElection_EndTime");
//       setRemainingTime(null);
//       fetchRequests();
//
//       // Lưu lại thông tin kỳ bầu cử trước khi đóng để phục vụ bước Archive phía sau
//       const savedTitle = electionStats.title;
//       const savedTotalVoted = electionStats.totalVoted;
//
//       // Chờ xác nhận từ Blockchain ở nền, sau đó khởi động quá trình Archive lịch sử
//       tx.wait()
//         .then(async () => {
//           const eId = await contract.currentElectionId();
//           // Archive event
//           await axios.post(
//             `${BACKEND_URL}/events/${eId}/archive`,
//             {
//               title: savedTitle,
//               totalVoted: savedTotalVoted,
//             },
//             { headers: { "x-admin-wallet-address": account } },
//           );
//           setIsVotingActive(false);
//           fetchRequests();
//         })
//         .catch(async (e) => {
//           console.error("End election tx failed:", e);
//           fetchRequests();
//         });
//     } catch (err) {
//       console.error("End election error:", err);
//       alert("Lỗi: " + (err.reason || err.message));
//     } finally {
//       setIsProcessing(false);
//     }
//   };
//
//   if (!isAdmin)
//     return (
//       <>
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
//           <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-100 text-center max-w-md w-full">
//             <div className="text-6xl mb-6">🔒</div>
//             <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tighter">
//               Admin Portal
//             </h2>
//             <p className="text-gray-400 font-bold mb-8 uppercase text-[10px] tracking-widest">
//               Hệ thống quản trị bảo mật
//             </p>
//             <button
//               onClick={connectWallet}
//               className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 uppercase tracking-widest"
//             >
//               Kết nối Wallet
//             </button>
//           </div>
//         </div>
//         {isErrorModalOpen && (
//           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-red-100">
//               <div className="p-8 text-center">
//                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-8 w-8"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2.5}
//                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                     />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
//                   TRUY CẬP BỊ TỪ CHỐI
//                 </h3>
//                 <p className="text-sm font-bold text-slate-500 italic mb-8 leading-relaxed">
//                   {errorModalMsg}
//                 </p>
//                 <button
//                   onClick={() => setIsErrorModalOpen(false)}
//                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
//                 >
//                   Đã hiểu
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </>
//     );
//
//   // Logic Lọc (Search)
//   const filteredRequests = requests.filter((r) =>
//     r.mssv.toLowerCase().includes(searchTerm.toLowerCase()),
//   );
//   const filteredAllApproved = allApprovedList.filter((r) =>
//     r.mssv.toLowerCase().includes(searchTerm.toLowerCase()),
//   );
//   const filteredActiveParticipants = approvedList.filter((r) =>
//     r.mssv.toLowerCase().includes(searchTerm.toLowerCase()),
//   );
//
//   const formatDate = (ts) => {
//     if (!ts) return "Chưa xác định";
//     const d = new Date(Number(ts));
//     return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()} (23:59)`;
//   };
//
//   // Voter Modal Logic
//   const filteredVoters = selectedElectionVoters.filter((m) =>
//     m.toLowerCase().includes(voterSearchQuery.toLowerCase()),
//   );
//   const totalVoterPages = Math.ceil(filteredVoters.length / VOTERS_PER_PAGE);
//   const displayedVoters = filteredVoters.slice(
//     (voterCurrentPage - 1) * VOTERS_PER_PAGE,
//     voterCurrentPage * VOTERS_PER_PAGE,
//   );
//
//   // Management Tab Logic
//   const filteredManagement = allApprovedList.filter((r) =>
//     r.mssv.toLowerCase().includes(managementSearchQuery.toLowerCase()),
//   );
//   const totalManagementPages = Math.ceil(filteredManagement.length / 5);
//   const displayedManagement = filteredManagement.slice(
//     (managementCurrentPage - 1) * 5,
//     managementCurrentPage * 5,
//   );
//
//   return (
//     <div className="admin-page min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
//       <Head>
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link
//           rel="preconnect"
//           href="https://fonts.gstatic.com"
//           crossOrigin="true"
//         />
//         <link
//           href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
//           rel="stylesheet"
//         />
//         <style>{`
//                     .admin-page {
//                         font-family: 'Outfit', 'Inter', sans-serif !important;
//                     }
//                     .admin-page input, .admin-page textarea, .admin-page button {
//                         font-family: 'Outfit', 'Inter', sans-serif !important;
//                     }
//                 `}</style>
//       </Head>
//       {/* Header / Navbar */}
//       <nav className="bg-white border-b border-slate-100 sticky top-0 z-40">
//         <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
//           <div className="flex items-center gap-10">
//             <button
//               onClick={() => setActiveTab("voting")}
//               className={`text-sm font-bold py-1 px-1 transition-all ${activeTab === "voting" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-900"}`}
//             >
//               Bỏ Phiếu
//             </button>
//             <button
//               onClick={() => setActiveTab("history")}
//               className={`text-sm font-bold py-1 px-1 transition-all ${activeTab === "history" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-900"}`}
//             >
//               Lịch sử
//             </button>
//             <button
//               onClick={() => setActiveTab("requests")}
//               className={`text-sm font-bold py-1 px-1 transition-all ${activeTab === "requests" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-900"}`}
//             >
//               Duyệt người tham gia
//             </button>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="text-right mr-3 hidden sm:block">
//               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
//                 Cài đặt
//               </p>
//               <p className="text-[11px] font-mono font-bold text-slate-600">
//                 Đã kết nối
//               </p>
//             </div>
//           </div>
//         </div>
//       </nav>
//
//       {/* Loading Overlay */}
//       {isProcessing && (
//         <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center">
//           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
//           <p className="font-bold text-slate-600 animate-pulse">
//             Đang xác thực giao dịch Blockchain...
//           </p>
//         </div>
//       )}
//
//       <main className="max-w-[1400px] mx-auto px-6 pt-8">
//         {/* Breadcrumbs */}
//         <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8 px-1">
//           <span>Trang chủ</span>
//           <span>/</span>
//           <span>Cuộc bỏ phiếu</span>
//           <span>/</span>
//           <span className="text-slate-900">
//             {isVotingActive ? "Đang diễn ra" : "Quản trị viên"}
//           </span>
//         </div>
//
//         <div className="flex flex-col lg:flex-row gap-10">
//           {/* LEFT COLUMN: Main Content (75%) */}
//           <div className="flex-1 min-w-0">
//             {activeTab === "voting" && (
//               <>
//                 {isVotingActive ? (
//                   <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
//                     {/* Status Toggle & Badge */}
//                     <div className="flex items-center gap-3 mb-6">
//                       <span className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 italic">
//                         ĐANG DIỄN RA
//                       </span>
//                     </div>
//
//                     <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-4xl">
//                       {electionStats.title ||
//                         "Tính năng công viên mới nào chúng ta nên ưu tiên cho năm 2024?"}
//                     </h1>
//
//                     <div className="bg-blue-50/10 border border-blue-100 p-8 rounded-[1.5rem] mb-12">
//                       <p className="text-slate-600 leading-relaxed font-semibold text-sm">
//                         {electionStats.description ||
//                           "Hội đồng thành phố đã phê duyệt ngân sách cho một cải tiến lớn đối với công viên trung tâm. Chúng tôi muốn nghe ý kiến từ cộng đồng về điều gì sẽ mang lại lợi ích nhất cho các gia đình và du khách hàng ngày."}
//                       </p>
//                     </div>
//
//                     <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tight">
//                       Phương án
//                     </h3>
//
//                     <div className="grid grid-cols-1 gap-4 mb-12">
//                       {electionStats.candidates.map((c, idx) => (
//                         <div
//                           key={idx}
//                           className="group bg-white border border-slate-100 p-8 rounded-[1.5rem] flex items-center justify-between hover:border-blue-200 transition-all shadow-sm"
//                         >
//                           <div className="flex items-center gap-6">
//                             <div className="w-6 h-6 rounded-full border-2 border-slate-100 flex items-center justify-center">
//                               <div className="w-3 h-3 rounded-full bg-slate-50"></div>
//                             </div>
//                             <div>
//                               <h4 className="font-bold text-slate-900 text-lg">
//                                 {c.name}
//                               </h4>
//                               <p className="text-sm font-medium text-slate-400 mt-1">
//                                 Lược trích mô tả về ứng viên hoặc phương án này
//                                 để người dân dễ dàng lựa chọn.
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//
//                     {remainingTime === 0 && (
//                       <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[1.5rem] flex items-center gap-4 animate-pulse">
//                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-red-50">
//                           <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             className="h-6 w-6 text-red-500"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                             stroke="currentColor"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2.5}
//                               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                             />
//                           </svg>
//                         </div>
//                         <div>
//                           <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight text-red-600">
//                             THỜI GIAN THEO LỊCH ĐÃ HẾT
//                           </h4>
//                           <p className="text-xs font-bold text-slate-600 italic mt-1">
//                             Yêu cầu kiểm tra tiến độ và Đóng phiếu kết quả ngay
//                             lập tức.
//                           </p>
//                         </div>
//                       </div>
//                     )}
//
//                     <button
//                       onClick={handleEndElection}
//                       className={`w-full text-white p-6 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-[0.98] mb-4 ${remainingTime === 0 ? "bg-red-600 hover:bg-red-700 shadow-red-200 animate-bounce cursor-pointer" : "bg-[#87bceb] hover:brightness-105"}`}
//                     >
//                       Đóng phiếu
//                     </button>
//                     <p className="text-center text-[11px] font-bold text-slate-400 mt-4 leading-normal">
//                       Bằng cách nhấp vào "Đóng phiếu", bạn đồng ý với các điều
//                       khoản dịch vụ của chúng tôi
//                     </p>
//                   </section>
//                 ) : (
//                   /* CREATE ELECTION FORM */
//                   <div className="bg-white border border-slate-100 p-10 rounded-[2rem] shadow-sm animate-in fade-in duration-500">
//                     <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
//                       Tạo cuộc bỏ phiếu
//                     </h2>
//                     <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">
//                       Thiết lập tham số cho đợt bầu cử mới
//                     </p>
//
//                     <div className="space-y-6">
//                       <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
//                           Tiêu đề cuộc bỏ phiếu
//                         </label>
//                         <input
//                           placeholder="Tiêu đề gợi nhớ..."
//                           className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
//                           onChange={(e) => setTitle(e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
//                           Nội dung mô tả
//                         </label>
//                         <textarea
//                           placeholder="Mô tả cho cử tri..."
//                           className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
//                           rows="3"
//                           onChange={(e) => setDescription(e.target.value)}
//                         />
//                       </div>
//                       <div>
//                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
//                           Danh sách ứng viên (Cách nhau bằng dấu phẩy)
//                         </label>
//                         <input
//                           placeholder="A, B, C..."
//                           className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
//                           onChange={(e) => setCandidates(e.target.value)}
//                         />
//                       </div>
//                       <div className="grid grid-cols-2 gap-6">
//                         <div>
//                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
//                             Bắt đầu
//                           </label>
//                           <input
//                             type="date"
//                             value={startDate}
//                             className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
//                             onChange={(e) => setStartDate(e.target.value)}
//                           />
//                         </div>
//                         <div>
//                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">
//                             Kết thúc
//                           </label>
//                           <input
//                             type="date"
//                             value={endDate}
//                             className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700"
//                             onChange={(e) => setEndDate(e.target.value)}
//                           />
//                         </div>
//                       </div>
//                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
//                         <div>
//                           <p className="font-black text-slate-700 text-sm">
//                             Chế độ tự động
//                           </p>
//                           <p className="text-[10px] font-bold text-slate-400 italic">
//                             Mở/Đóng theo thời gian thực (UTC+7)
//                           </p>
//                         </div>
//                         <button
//                           onClick={() => setIsAutoMode(!isAutoMode)}
//                           className={`w-14 h-8 rounded-full p-1 transition-all ${isAutoMode ? "bg-blue-600" : "bg-slate-200"}`}
//                         >
//                           <div
//                             className={`w-6 h-6 bg-white rounded-full shadow transition-all transform ${isAutoMode ? "translate-x-6" : "translate-x-0"}`}
//                           ></div>
//                         </button>
//                       </div>
//                       <button
//                         onClick={handleCreateElection}
//                         className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black uppercase tracking-widest hover:border-blue-600 border-2 border-transparent transition-all mt-4 shadow-lg shadow-slate-100"
//                       >
//                         Khởi tạo đợt bầu cử
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </>
//             )}
//
//             {activeTab === "requests" && (
//               <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
//                 {/* Pending Approval */}
//                 <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
//                   <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
//                     <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl">
//                       Đăng ký mới ({filteredRequests.length})
//                     </h3>
//                   </div>
//                   <div className="divide-y divide-slate-50">
//                     {filteredRequests.map((r, idx) => (
//                       <div
//                         key={idx}
//                         className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
//                       >
//                         <span className="font-black text-slate-700 text-lg">
//                           {r.mssv}
//                         </span>
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => handleApprove(r.mssv)}
//                             className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-50 transition-all active:scale-95"
//                           >
//                             Approve
//                           </button>
//                           <button
//                             onClick={() => handleRemove(r.mssv)}
//                             className="bg-slate-100 text-slate-400 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
//                           >
//                             Reject
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                     {filteredRequests.length === 0 && (
//                       <div className="p-12 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
//                         Không có yêu cầu chờ duyệt
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleResetAll}
//                   className="w-full p-8 border-2 border-dashed border-red-100 rounded-[2.5rem] text-red-300 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all scale-95 opacity-50 hover:opacity-100 mb-12"
//                 >
//                   RESET HỆ THỐNG: Xóa toàn bộ sinh viên
//                 </button>
//
//                 {/* Current Participants Overview Box (Like Sidebar) */}
//                 <div className="bg-white border border-slate-100 p-10 rounded-[2rem] shadow-sm animate-in fade-in duration-700">
//                   <div className="flex justify-between items-center mb-10">
//                     <div>
//                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
//                         NGƯỜI THAM GIA HIỆN TẠI
//                       </h4>
//                       <p className="text-2xl font-black text-slate-900 tracking-tight">
//                         {allApprovedList.length} sinh viên đã duyệt
//                       </p>
//                     </div>
//                     <button
//                       onClick={() => setIsManagementModalOpen(true)}
//                       className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-lg"
//                     >
//                       Quản lý chuyên sâu
//                     </button>
//                   </div>
//                   <div className="flex flex-wrap gap-3">
//                     {allApprovedList.length > 0 ? (
//                       allApprovedList.slice(0, 10).map((r, i) => (
//                         <span
//                           key={i}
//                           className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-600 text-xs"
//                         >
//                           {r.mssv}
//                         </span>
//                       ))
//                     ) : (
//                       <p className="text-sm font-bold text-slate-300 italic py-4 w-full text-center border-2 border-dashed border-slate-50 rounded-2xl">
//                         Chưa có sinh viên nào được duyệt
//                       </p>
//                     )}
//                     {allApprovedList.length > 10 && (
//                       <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center">
//                         +{allApprovedList.length - 10} người khác
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </section>
//             )}
//
//             {activeTab === "history" && (
//               <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
//                 <div className="flex items-center gap-4 mb-8">
//                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
//                     Lịch sử bầu chọn
//                   </h3>
//                   <div className="flex-1 h-px bg-slate-100"></div>
//                 </div>
//                 <div className="space-y-4">
//                   {electionHistory.map((h, idx) => (
//                     <div
//                       key={idx}
//                       className="bg-white border border-slate-100 p-6 rounded-[1.5rem] hover:border-blue-100 transition-all shadow-sm group"
//                     >
//                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
//                         <div className="flex-1 min-w-0">
//                           <h4 className="font-black text-slate-900 uppercase text-base mb-1 truncate">
//                             {h.title}
//                           </h4>
//                           <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
//                             <div className="flex items-center gap-2">
//                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
//                                 Quán quân:
//                               </span>
//                               <span className="text-xs font-black text-blue-600 uppercase leading-none">
//                                 {h.winner || "---"}
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
//                                 Tổng phiếu:
//                               </span>
//                               <span className="text-xs font-black text-slate-700 leading-none">
//                                 {h.totalVoted}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-3 shrink-0">
//                           <button
//                             onClick={() => {
//                               setSelectedDescription(
//                                 h.description ||
//                                   "Không có mô tả cho cuộc bầu chọn này.",
//                               );
//                               setSelectedElectionCandidates(h.candidates || []);
//                               setIsDescriptionModalOpen(true);
//                             }}
//                             className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100"
//                           >
//                             Chi tiết
//                           </button>
//                           <button
//                             onClick={() => {
//                               setSelectedElectionVoters(h.participants || []);
//                               setIsVoterModalOpen(true);
//                               setVoterSearchQuery("");
//                               setVoterCurrentPage(1);
//                             }}
//                             className="px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-100 hover:border-blue-200"
//                           >
//                             Xem cử tri
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                   {electionHistory.length === 0 && (
//                     <div className="p-12 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
//                       Chưa có dữ liệu lịch sử
//                     </div>
//                   )}
//                 </div>
//               </section>
//             )}
//           </div>
//
//           {/* RIGHT COLUMN: Sidebar (25%) */}
//           <aside className="w-full lg:w-[320px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
//             {/* Statistics Widget */}
//             {activeTab === "voting" && (
//               <div className="bg-white border border-slate-100 p-8 rounded-[1rem] shadow-sm">
//                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
//                   THỐNG KÊ
//                 </h4>
//                 <div className="flex gap-4 mb-8">
//                   <div className="flex-1 bg-slate-50 p-6 rounded-xl text-center">
//                     <p className="text-2xl font-black text-slate-900 tracking-tight">
//                       {isVotingActive
//                         ? electionStats.totalVoted.toLocaleString()
//                         : "0"}
//                     </p>
//                     <p className="text-[8px] font-black text-slate-400 uppercase mt-1 leading-none tracking-widest">
//                       TỔNG PHIẾU
//                     </p>
//                   </div>
//                   <div className="flex-1 bg-slate-50 p-6 rounded-xl text-center">
//                     <p className="text-xl font-black text-slate-900 tracking-tight">
//                       {isVotingActive
//                         ? electionStats.endDate
//                           ? (() => {
//                               const d = new Date(Number(electionStats.endDate));
//                               return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
//                             })()
//                           : "VÔ THỜI HẠN"
//                         : "--"}
//                     </p>
//                     <p className="text-[10px] font-black text-slate-400 uppercase mt-1 leading-none tracking-widest whitespace-nowrap">
//                       {isVotingActive && electionStats.endDate
//                         ? (() => {
//                             const d = new Date(Number(electionStats.endDate));
//                             return `(${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")})`;
//                           })()
//                         : "HẠN CHÓT"}
//                     </p>
//                   </div>
//                 </div>
//                 <div>
//                   <div className="flex justify-between items-end mb-3">
//                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
//                       Tiến độ tham gia
//                     </p>
//                     <p className="text-xs font-black text-blue-600">
//                       {isVotingActive
//                         ? `${Math.round((electionStats.totalVoted / (electionStats.totalApproved || 1)) * 100)}%`
//                         : "Tạm đóng"}
//                     </p>
//                   </div>
//                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
//                     <div
//                       className="h-full bg-blue-600 rounded-full transition-all duration-1000"
//                       style={{
//                         width: `${isVotingActive ? (electionStats.totalVoted / (electionStats.totalApproved || 1)) * 100 : 0}%`,
//                       }}
//                     ></div>
//                   </div>
//                   <p className="text-[9px] font-bold text-slate-300 leading-normal italic">
//                     Dựa trên số lượng cử tri đủ điều kiện ước tính.
//                   </p>
//                 </div>
//               </div>
//             )}
//
//             {/* Recent Activity List */}
//             {activeTab === "voting" && (
//               <div className="bg-white border border-slate-100 p-8 rounded-[1rem] shadow-sm animate-in fade-in duration-700">
//                 <div className="flex justify-between items-center mb-8">
//                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                     NGƯỜI THAM GIA
//                   </h4>
//                   {allApprovedList.length > 0 && (
//                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                   )}
//                 </div>
//                 <div className="space-y-6">
//                   {allApprovedList.length > 0 ? (
//                     allApprovedList.slice(0, 5).map((r, i) => (
//                       <div
//                         key={i}
//                         className="flex justify-between items-center group"
//                       >
//                         <div className="flex items-center gap-3">
//                           <div className="w-1.5 h-1.5 bg-blue-100 group-hover:bg-blue-600 rounded-full transition-colors"></div>
//                           <p className="font-bold text-slate-900 text-sm italic">
//                             {r.mssv}
//                           </p>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
//                       <p className="text-sm font-bold text-slate-300 italic">
//                         Chưa có ai
//                       </p>
//                     </div>
//                   )}
//                 </div>
//
//                 {allApprovedList.length > 5 && (
//                   <p className="text-center mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
//                     ... và {allApprovedList.length - 5} người khác
//                   </p>
//                 )}
//
//                 <button
//                   onClick={() => setIsManagementModalOpen(true)}
//                   className="w-full mt-10 py-3 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all font-sans"
//                 >
//                   Quản lý danh sách
//                 </button>
//               </div>
//             )}
//           </aside>
//         </div>
//       </main>
//
//       {/* Management Modal (Approved Participants) */}
//       {isManagementModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
//             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
//                   Quản lý sinh viên
//                 </h3>
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//                   Tổng cộng {allApprovedList.length} người đã duyệt
//                 </p>
//               </div>
//               <button
//                 onClick={() => setIsManagementModalOpen(false)}
//                 className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors"
//               >
//                 <span className="text-2xl font-light text-slate-400">
//                   &times;
//                 </span>
//               </button>
//             </div>
//             <div className="p-8">
//               <div className="relative mb-8">
//                 <input
//                   type="text"
//                   placeholder="Tìm kiếm mssv..."
//                   className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700 text-sm"
//                   value={managementSearchQuery}
//                   onChange={(e) => {
//                     setManagementSearchQuery(e.target.value);
//                     setManagementCurrentPage(1);
//                   }}
//                 />
//                 <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2.5}
//                       d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                     />
//                   </svg>
//                 </div>
//               </div>
//
//               <div className="space-y-3 min-h-[300px]">
//                 {displayedManagement.map((r, idx) => (
//                   <div
//                     key={idx}
//                     className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-red-100 hover:bg-white transition-all"
//                   >
//                     <div className="flex items-center gap-4">
//                       <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px]">
//                         ID
//                       </div>
//                       <span className="font-black text-slate-700">
//                         {r.mssv}
//                       </span>
//                     </div>
//                     <button
//                       onClick={() => handleRemove(r.mssv)}
//                       className="p-2 text-slate-300 hover:text-red-500 transition-colors"
//                     >
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-5 w-5"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                         stroke="currentColor"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                         />
//                       </svg>
//                     </button>
//                   </div>
//                 ))}
//                 {filteredManagement.length === 0 && (
//                   <div className="flex flex-col items-center justify-center py-20 text-slate-300">
//                     <p className="font-bold italic uppercase text-xs tracking-widest">
//                       Không có dữ liệu
//                     </p>
//                   </div>
//                 )}
//               </div>
//
//               {totalManagementPages > 1 && (
//                 <div className="mt-10 flex items-center justify-center gap-4">
//                   <button
//                     disabled={managementCurrentPage === 1}
//                     onClick={() => setManagementCurrentPage((p) => p - 1)}
//                     className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-colors"
//                   >
//                     <span className="font-black text-slate-600">&larr;</span>
//                   </button>
//                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
//                     Trang {managementCurrentPage} / {totalManagementPages}
//                   </span>
//                   <button
//                     disabled={managementCurrentPage === totalManagementPages}
//                     onClick={() => setManagementCurrentPage((p) => p + 1)}
//                     className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 hover:bg-slate-50 transition-colors"
//                   >
//                     <span className="font-black text-slate-600">&rarr;</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//
//       {/* Description Modal */}
//       {isDescriptionModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
//             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
//                   Chi tiết bầu chọn
//                 </h3>
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//                   Thông tin bổ sung từ Admin
//                 </p>
//               </div>
//               <button
//                 onClick={() => setIsDescriptionModalOpen(false)}
//                 className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors"
//               >
//                 <span className="text-2xl font-light text-slate-400">
//                   &times;
//                 </span>
//               </button>
//             </div>
//             <div className="p-8 pb-12 overflow-y-auto max-h-[70vh]">
//               <div className="mb-8">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
//                   Mô tả cuộc bầu chọn
//                 </label>
//                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
//                   <p className="text-slate-600 leading-relaxed font-semibold text-sm italic">
//                     "{selectedDescription}"
//                   </p>
//                 </div>
//               </div>
//
//               <div>
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
//                   Kết quả các phương án
//                 </label>
//                 <div className="space-y-3">
//                   {selectedElectionCandidates.length > 0 ? (
//                     selectedElectionCandidates.map((c, i) => (
//                       <div
//                         key={i}
//                         className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
//                       >
//                         <span className="font-bold text-slate-700">
//                           {c.name}
//                         </span>
//                         <div className="flex items-center gap-3">
//                           <span className="text-xs font-black text-blue-600">
//                             {c.voteCount} phiếu
//                           </span>
//                           <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                             <div
//                               className="h-full bg-blue-500"
//                               style={{
//                                 width: `${Math.min(100, (Number(c.voteCount) / (selectedElectionCandidates.reduce((acc, curr) => acc + Number(curr.voteCount), 0) || 1)) * 100)}%`,
//                               }}
//                             ></div>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-center text-xs font-bold text-slate-300 italic py-4">
//                       Không có dữ liệu phương án
//                     </p>
//                   )}
//                 </div>
//               </div>
//
//               <button
//                 onClick={() => setIsDescriptionModalOpen(false)}
//                 className="w-full mt-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
//               >
//                 Đóng cửa sổ
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//
//       {/* Voter Modal */}
//       {isVoterModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
//             <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
//               <div>
//                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
//                   Danh sách bầu chọn
//                 </h3>
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//                   Tổng cộng {filteredVoters.length} cử tri
//                 </p>
//               </div>
//               <button
//                 onClick={() => setIsVoterModalOpen(false)}
//                 className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors"
//               >
//                 <span className="text-2xl font-light text-slate-400">
//                   &times;
//                 </span>
//               </button>
//             </div>
//
//             <div className="p-8">
//               {/* Search Box */}
//               <div className="relative mb-8">
//                 <input
//                   type="text"
//                   placeholder="Tìm kiếm MSSV..."
//                   className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-700 text-sm"
//                   value={voterSearchQuery}
//                   onChange={(e) => {
//                     setVoterSearchQuery(e.target.value);
//                     setVoterCurrentPage(1);
//                   }}
//                 />
//                 <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2.5}
//                       d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                     />
//                   </svg>
//                 </div>
//               </div>
//
//               {/* Voter List */}
//               <div className="space-y-3 min-h-[300px]">
//                 {displayedVoters.map((mssv, idx) => (
//                   <div
//                     key={idx}
//                     className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-blue-100 hover:bg-white transition-all"
//                   >
//                     <span className="font-black text-slate-700">{mssv}</span>
//                     <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
//                       Đã xác thực
//                     </span>
//                   </div>
//                 ))}
//                 {filteredVoters.length === 0 && (
//                   <div className="flex flex-col items-center justify-center py-20 text-slate-300">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-12 w-12 mb-4 opacity-20"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
//                       />
//                     </svg>
//                     <p className="font-bold italic uppercase text-xs tracking-widest">
//                       Không tìm thấy kết quả
//                     </p>
//                   </div>
//                 )}
//               </div>
//
//               {/* Pagination */}
//               {totalVoterPages > 1 && (
//                 <div className="mt-10 flex items-center justify-center gap-4">
//                   <button
//                     disabled={voterCurrentPage === 1}
//                     onClick={() => setVoterCurrentPage((p) => p - 1)}
//                     className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
//                   >
//                     <span className="font-black text-slate-600">&larr;</span>
//                   </button>
//                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
//                     Trang {voterCurrentPage} / {totalVoterPages}
//                   </span>
//                   <button
//                     disabled={voterCurrentPage === totalVoterPages}
//                     onClick={() => setVoterCurrentPage((p) => p + 1)}
//                     className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
//                   >
//                     <span className="font-black text-slate-600">&rarr;</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//
//       {/* ERROR MODAL - BinhChonNgay Style */}
//       {isErrorModalOpen && (
//         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-red-100">
//             <div className="p-8 text-center">
//               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-8 w-8"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2.5}
//                     d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
//                 TRUY CẬP BỊ TỪ CHỐI
//               </h3>
//               <p className="text-sm font-bold text-slate-500 italic mb-8 leading-relaxed">
//                 {errorModalMsg}
//               </p>
//               <button
//                 onClick={() => setIsErrorModalOpen(false)}
//                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"
//               >
//                 Đã hiểu
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* Footer */}
//       <footer className="max-w-[1400px] mx-auto px-6 mt-20 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30">
//         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
//           © 2024 Nền tảng BinhChonNgay.
//         </p>
//         <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
//           <button className="hover:text-slate-900 transition-colors">
//             Điều khoản
//           </button>
//           <button className="hover:text-slate-900 transition-colors">
//             Bảo mật
//           </button>
//           <button className="hover:text-slate-900 transition-colors">
//             Trợ giúp
//           </button>
//         </div>
//       </footer>
//     </div>
//   );
// }
