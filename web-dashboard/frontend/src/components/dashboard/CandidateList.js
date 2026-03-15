import AccountCircleIcon from "@mui/icons-material/AccountCircle";

/**
 * Renders a single candidate row with avatar, name, bio, and optional vote bar.
 */
function CandidateRow({ candidate, voteCount, totalVotes }) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-200 flex items-center justify-center">
        {candidate.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.avatarUrl}
            alt={candidate.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <AccountCircleIcon sx={{ fontSize: 32, color: "#94a3b8" }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
            {candidate.name}
          </p>
          {totalVotes > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-black text-slate-700">
                {voteCount.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {pct}%
              </span>
            </div>
          )}
        </div>

        {candidate.bio && (
          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2 mb-2">
            {candidate.bio}
          </p>
        )}

        {totalVotes > 0 && (
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Skeleton loader rows */
function CandidateSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl animate-pulse"
        >
          <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Renders a labeled group of candidates with a colored badge. */
function CandidateSection({ label, badgeClass, candidates, votes, totalVotes }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeClass}`}>
          {label}
        </span>
        <span className="text-[9px] font-bold text-slate-400">{candidates.length}</span>
      </div>
      {candidates.length === 0 ? (
        <p className="text-xs text-slate-300 italic text-center py-3 uppercase tracking-widest">
          Chưa có
        </p>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              voteCount={Number(votes[c.id] ?? 0)}
              totalVotes={totalVotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Renders candidate list split into "assigned" and "self-nominated" sections.
 * Props:
 *   assigned        – admin-assigned candidates
 *   selfNominated   – self-nominated candidates
 *   votes           – { [candidateId]: voteCount }
 *   loading / error – fetch state
 */
export default function CandidateList({
  assigned = [],
  selfNominated = [],
  votes = {},
  loading,
  error,
}) {
  const totalVotes = Object.values(votes).reduce((a, b) => a + Number(b), 0);

  if (loading) return <CandidateSkeleton />;

  if (error) {
    return (
      <p className="text-xs font-bold text-red-400 italic text-center py-4">
        {error}
      </p>
    );
  }

  if (assigned.length === 0 && selfNominated.length === 0) {
    return (
      <p className="text-xs font-bold text-slate-300 italic text-center py-6 uppercase tracking-widest">
        Chưa có ứng viên nào
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin-assigned */}
      <CandidateSection
        label="Được chỉ định"
        badgeClass="bg-blue-50 text-blue-600"
        candidates={assigned}
        votes={votes}
        totalVotes={totalVotes}
      />

      {/* Divider — only when both sections have content */}
      {assigned.length > 0 && selfNominated.length > 0 && (
        <div className="border-t border-dashed border-slate-100" />
      )}

      {/* Self-nominated */}
      {selfNominated.length > 0 && (
        <CandidateSection
          label="Tự đề cử"
          badgeClass="bg-amber-50 text-amber-600"
          candidates={selfNominated}
          votes={votes}
          totalVotes={totalVotes}
        />
      )}
    </div>
  );
}
