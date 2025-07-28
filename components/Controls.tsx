// components/Controls.tsx
import { Action } from "./CandleChart";

type Props = {
  balance: number;
  onTrade: (action: Action) => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  pnl: number;
  tradeSize: number;
  onSizeChange: (size: number) => void;
  totalPnl: number;
  percentPnl: number;
  showRSI: boolean;
  showBB: boolean;
  showMACD: boolean;
  onToggleRSI: () => void;
  onToggleBB: () => void;
  onToggleMACD: () => void;
};

export default function Controls({
  balance,
  onTrade,
  onTogglePlay,
  isPlaying,
  pnl,
  tradeSize,
  onSizeChange,
  totalPnl,
  percentPnl,
  showRSI,
  showBB,
  showMACD,
  onToggleRSI,
  onToggleBB,
  onToggleMACD,
}: Props) {
  return (
    <div className="flex flex-col space-y-4 bg-[#1f2937] p-4 rounded-xl text-white">
      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <button onClick={onTogglePlay} className="bg-blue-600 px-4 py-2 rounded">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => onTrade('LONG')} className="bg-green-600 px-4 py-2 rounded">
            Long
          </button>
          <button onClick={() => onTrade('SHORT')} className="bg-red-600 px-4 py-2 rounded">
            Short
          </button>
          <button onClick={() => onTrade('NONE')} className="bg-gray-600 px-4 py-2 rounded">
            Skip
          </button>
        </div>
        <div className="text-right">
          <div>PnL: {totalPnl.toFixed(2)} ({percentPnl.toFixed(2)}%)</div>
          <div>Balance: {balance.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <span className="mr-2">Size:</span>
          <input
            type="number"
            value={tradeSize}
            onChange={e => onSizeChange(Number(e.target.value))}
            className="w-20 text-black p-1 rounded"
            min={1}
          />
        </label>

        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={showRSI} onChange={onToggleRSI} />
          <span>RSI</span>
        </label>

        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={showBB} onChange={onToggleBB} />
          <span>BB</span>
        </label>

        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={showMACD} onChange={onToggleMACD} />
          <span>MACD</span>
        </label>
      </div>
    </div>
  );
}
