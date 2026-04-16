import { useRef } from 'react';
import type { GimmickEvent } from '../../types';

const PX_PER_SEC = 50; // 1秒あたりのピクセル幅
const TRACK_HEIGHT = 32;
const RULER_HEIGHT = 20;

const GIMMICK_COLORS: Record<string, string> = {
  aoe_circle: '#ff4400',
  aoe_line:   '#ff6600',
  aoe_fan:    '#ff8800',
  aoe_donut:  '#ffaa00',
  stack:      '#ffdd00',
  spread:     '#aaff00',
  knockback:  '#aa44ff',
  pull:       '#cc66ff',
  tower:      '#00ffaa',
};

interface Props {
  timeline: GimmickEvent[];
  selectedId: string | null;
  totalDuration: number;
  onSelect: (id: string) => void;
  onUpdateTime: (id: string, time: number) => void;
}

export function Timeline({ timeline, selectedId, totalDuration, onSelect, onUpdateTime }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startClientX: number; startTime: number } | null>(null);
  const width = Math.max(totalDuration * PX_PER_SEC + 100, 800);

  const onMouseDown = (e: React.MouseEvent, id: string, time: number) => {
    e.stopPropagation();
    onSelect(id);
    dragRef.current = { id, startClientX: e.clientX, startTime: time };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startClientX;
    const newTime = Math.max(0, dragRef.current.startTime + dx / PX_PER_SEC);
    onUpdateTime(dragRef.current.id, Math.round(newTime * 2) / 2); // 0.5秒刻み
  };

  const onMouseUp = () => { dragRef.current = null; };

  // ルーラーの目盛り
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration + 2; t++) ticks.push(t);

  return (
    <div
      ref={containerRef}
      style={{
        height: RULER_HEIGHT + TRACK_HEIGHT + 12,
        overflowX: 'auto',
        overflowY: 'hidden',
        background: '#0d0d1a',
        borderTop: '1px solid #2a2a4a',
        position: 'relative',
        cursor: dragRef.current ? 'grabbing' : 'default',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div style={{ width, position: 'relative', paddingTop: RULER_HEIGHT }}>
        {/* ルーラー */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: RULER_HEIGHT,
          background: '#12122a', borderBottom: '1px solid #2a2a4a',
        }}>
          {ticks.map(t => (
            <div key={t} style={{
              position: 'absolute', left: t * PX_PER_SEC,
              top: 0, height: RULER_HEIGHT,
              borderLeft: '1px solid #2a2a4a',
              color: '#556',
              fontSize: 9,
              paddingLeft: 2,
              lineHeight: `${RULER_HEIGHT}px`,
              userSelect: 'none',
            }}>
              {t}s
            </div>
          ))}
        </div>

        {/* ギミックブロック */}
        {timeline.map(ev => {
          const warnStart = ev.time - ev.warningDuration;
          const left = warnStart * PX_PER_SEC;
          const blockWidth = ev.warningDuration * PX_PER_SEC;
          const color = GIMMICK_COLORS[ev.type] ?? '#888';
          const isSelected = ev.id === selectedId;

          return (
            <div
              key={ev.id}
              title={`${ev.label ?? ev.type} @ ${ev.time}s`}
              onMouseDown={e => onMouseDown(e, ev.id, ev.time)}
              style={{
                position: 'absolute',
                left: Math.max(0, left),
                top: 4,
                width: blockWidth,
                height: TRACK_HEIGHT - 8,
                background: `${color}${isSelected ? 'ee' : '88'}`,
                border: `2px solid ${isSelected ? '#ffffff' : color}`,
                borderRadius: 4,
                cursor: 'grab',
                overflow: 'hidden',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 4,
                fontSize: 10,
                color: '#fff',
                boxShadow: isSelected ? `0 0 8px ${color}` : 'none',
              }}
            >
              {ev.label ?? ev.type}
            </div>
          );
        })}
      </div>
    </div>
  );
}
