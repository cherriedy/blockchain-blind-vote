interface StatusConfig {
    label: string;
    dot: string;
    badge: string;
    pulse: boolean;
}

interface StatusBadgeProps {
    status: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    active:    { label: 'Đang diễn ra', dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',  pulse: true  },
    pending:   { label: 'Sắp diễn ra',  dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   pulse: false },
    completed: { label: 'Đã kết thúc',  dot: 'bg-slate-400',  badge: 'bg-slate-50 text-slate-500 border-slate-200',   pulse: false },
    cancelled: { label: 'Đã hủy',       dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-200',         pulse: false },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`}></span>
            {cfg.label}
        </span>
    );
}
