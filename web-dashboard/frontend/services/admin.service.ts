import api from '@/lib/api';

export const adminService = {
  // --- Auth & Admin Management ---
  getMe: () => api.get('/admins/me'),
  getAdmins: (search?: string, role?: string) => api.get('/admins', { params: { search, role } }),
  createAdmin: (data: any) => api.post('/admins', data),
  updateAdmin: (id: string, data: any) => api.put(`/admins/${id}`, data),
  deleteAdmin: (id: string) => api.delete(`/admins/${id}`),

  getMyElections: () => api.get('/admins/my-elections'),
  getMyPolls: () => api.get('/admins/my-polls'),

  // --- Elections ---
  getElections: (search?: string) => api.get('/elections', { params: { search } }),
  createElection: (data: any) => api.post('/elections', data),
  updateElection: (id: string, data: any) => api.put(`/elections/${id}`, data),
  deleteElection: (id: string) => api.delete(`/elections/${id}`),
  startElection: (id: string) => api.patch(`/elections/${id}/start`),
  endElection: (id: string) => api.patch(`/elections/${id}/end`),

  // Quản lý quan hệ Election
  getAllSelfNominees: (status?: string, search?: string) =>
    api.get(`/elections/self-nominees`, {
      params: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(search ? { search } : {}),
      },
    }),
  getSelfNominees: (id: string, status?: string) =>
    api.get(`/elections/${id}/self-nominees`, {
      params: status && status !== 'ALL' ? { status } : {},
    }),
  approveSelfNominee: (id: string, candidateId: string) =>
    api.post(`/elections/${id}/self-nominees/${candidateId}/approve`),
  rejectSelfNominee: (id: string, candidateId: string, adminNotes: string) =>
    api.patch(`/elections/${id}/self-nominees/${candidateId}/reject`, {
      adminNotes,
    }),

  requestInfoSelfNominee: (id: string, candidateId: string, adminNotes: string) =>
    api.patch(`/elections/${id}/self-nominees/${candidateId}/request-info`, {
      adminNotes,
    }),

  getElectionVoters: (id: string) => api.get(`/elections/${id}/voters`),
  assignVoterToElection: (id: string, data: { voterIds: string[] }) =>
    api.post(`/elections/${id}/voters`, data),
  removeVoterFromElection: (id: string, voterId: string) =>
    api.delete(`/elections/${id}/voters`, { data: { voterId } }),

  getElectionAdmins: (id: string) => api.get(`/elections/${id}/admins`),
  assignAdminToElection: (id: string, data: { adminIds: string[] }) =>
    api.post(`/elections/${id}/admins`, data),
  removeAdminFromElection: (id: string, adminId: string) =>
    api.delete(`/elections/${id}/admins`, { data: { adminId } }),

  // --- Polls ---
  getPolls: (search?: string) => api.get('/polls', { params: { search } }),
  createPoll: (data: any) => api.post('/polls', data),
  updatePoll: (id: string, data: any) => api.put(`/polls/${id}`, data),
  deletePoll: (id: string) => api.delete(`/polls/${id}`),
  startPoll: (id: string) => api.patch(`/polls/${id}/start`),
  endPoll: (id: string) => api.patch(`/polls/${id}/end`),

  // Quản lý quan hệ Poll
  getPollVoters: (id: string) => api.get(`/polls/${id}/voters`),
  assignVoterToPoll: (id: string, data: { voterIds: string[] }) =>
    api.post(`/polls/${id}/voters`, data),
  removeVoterFromPoll: (id: string, voterId: string) =>
    api.delete(`/polls/${id}/voters`, { data: { voterId } }),

  getPollAdmins: (id: string) => api.get(`/polls/${id}/admins`),
  assignAdminToPoll: (id: string, data: { adminIds: string[] }) =>
    api.post(`/polls/${id}/admins`, data),
  removeAdminFromPoll: (id: string, adminId: string) =>
    api.delete(`/polls/${id}/admins`, { data: { adminId } }),

  // --- Voters & Candidates ---
  getVoters: (search?: string) => api.get('/voters', { params: { search } }),

  createVoter: (data: any) => api.post('/voters', data),
  updateVoter: (id: string, data: any) => api.put(`/voters/${id}`, data),
  deleteVoter: (id: string) => api.delete(`/voters/${id}`),
  toggleStatusVoter: (id: string, isActive: boolean) =>
    api.patch(`/voters/${id}/status`, { isActive }),

  getCandidates: (search?: string) => api.get('/candidates', { params: { search } }),
  createCandidate: (data: FormData) => api.post('/candidates', data),
  updateCandidate: (id: string, data: FormData) => api.put(`/candidates/${id}`, data),
  deleteCandidate: (id: string) => api.delete(`/candidates/${id}`),

  getAuditLogs: (search?: string) => api.get('/audit-logs', { params: { search } }),
};
