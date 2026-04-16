import type { GimmickType } from '../../types';

interface PaletteItem {
  type: GimmickType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'aoe_circle',  label: '円形AoE',   icon: '⭕', color: '#ff4400', description: '固定 or プレイヤー追尾の円範囲攻撃' },
  { type: 'aoe_line',    label: '直線AoE',   icon: '▬',  color: '#ff6600', description: '指定方向の直線範囲攻撃' },
  { type: 'aoe_fan',     label: '扇形AoE',   icon: '📐', color: '#ff8800', description: 'ボス方向の扇状範囲攻撃' },
  { type: 'aoe_donut',   label: 'ドーナツ',  icon: '🍩', color: '#ffaa00', description: '中央が安全地帯のリング攻撃' },
  { type: 'stack',       label: '頭割り',    icon: '⚡', color: '#ffdd00', description: '指定人数で重なってダメージ分散' },
  { type: 'spread',      label: '散開',      icon: '💥', color: '#ddff00', description: '全員が離れて被弾を避ける' },
  { type: 'knockback',   label: '吹き飛ばし', icon: '💨', color: '#aa44ff', description: '原点から外側へ吹き飛ばす' },
  { type: 'pull',        label: '引き寄せ',  icon: '🌀', color: '#cc66ff', description: '原点へ引き寄せる' },
  { type: 'tower',       label: '塔踏み',    icon: '🗼', color: '#00ffaa', description: '指定人数が踏む必要がある塔' },
];

interface Props {
  onDragStart: (type: GimmickType) => void;
}

export function GimmickPalette({ onDragStart }: Props) {
  return (
    <div style={{
      width: 148,
      background: '#12122a',
      borderRight: '1px solid #2a2a4a',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '8px 10px 4px', fontSize: 11, color: '#7788aa', fontWeight: 'bold', letterSpacing: 1 }}>
        ギミック
      </div>
      {PALETTE_ITEMS.map(item => (
        <div
          key={item.type}
          draggable
          title={item.description}
          onDragStart={e => {
            e.dataTransfer.setData('gimmickType', item.type);
            onDragStart(item.type);
          }}
          style={{
            padding: '7px 10px',
            margin: '2px 6px',
            borderRadius: 6,
            cursor: 'grab',
            background: '#1a1a33',
            border: `1px solid ${item.color}44`,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            userSelect: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#252545')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1a1a33')}
        >
          <span style={{ fontSize: 16 }}>{item.icon}</span>
          <span style={{ fontSize: 12, color: '#ccd', lineHeight: 1.2 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
