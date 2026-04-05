import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PollIcon from '@mui/icons-material/Poll';

interface EmptyStateProps {
  type: 'election' | 'poll';
}

export default function EmptyState({ type }: EmptyStateProps) {
  const Icon = type === 'election' ? HowToVoteIcon : PollIcon;
  return (
    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
      <div className="flex justify-center mb-4">
        <Icon sx={{ fontSize: 48, color: '#cbd5e1' }} />
      </div>
      <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">
        Không có {type === 'election' ? 'cuộc bầu cử' : 'khảo sát'} nào dành cho bạn
      </p>
    </div>
  );
}
