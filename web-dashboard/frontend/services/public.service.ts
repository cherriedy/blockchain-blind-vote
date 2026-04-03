import publicApi from "@/lib/publicApi";

export const publicApiService = {
    getEligibleElection: (walletAddress: string, studentId: string) =>
        publicApi.get('/elections/eligible', {
            params: { walletAddress, studentId },
        }),

    getEligiblePoll: (walletAddress: string, studentId: string) =>
        publicApi.get('/polls/eligible', {
            params: { walletAddress, studentId },
        }),

    getElectionCandidates: (id: string) => publicApi.get(`/elections/${id}/candidates`),

    getMyCandidate: (walletAddress: string) =>
        publicApi.get('/candidates/me', {
            params: { walletAddress }
        }),

    selfNominate: (electionId: string, data: any) =>
        publicApi.post(`/elections/${electionId}/self-nominees`, data,),

    registerCandidate: (formData: FormData) =>
        publicApi.post('/candidates/register', formData),

    getMySelfNominations: (walletAddress: string, studentId: string) =>
        publicApi.get(`/elections/my-self-nominations`, {
            params: { walletAddress, studentId },
        }),

    resubmitSelfNomination: (electionId: string, formData: FormData) =>
        publicApi.patch(`/elections/${electionId}/self-nominees/resubmit`, formData),

    getPublicElection: (walletAddress: string, studentId: string) =>
        publicApi.get('/elections/public', {
            params: { walletAddress, studentId },
        }),
}