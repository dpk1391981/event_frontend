'use client';

interface Props {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function TokenBadge({ balance, size = 'md' }: Props) {
  const classes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }[size];

  return (
    <span className={`inline-flex items-center ${classes} bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold`}>
      <span>🪙</span>
      <span>{balance.toLocaleString()}</span>
      <span className="font-normal text-amber-500">tokens</span>
    </span>
  );
}
