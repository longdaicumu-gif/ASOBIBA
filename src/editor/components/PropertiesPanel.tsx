import type { GimmickEvent } from '../../types';

interface Props {
  gimmick: GimmickEvent | null;
  onChange: (id: string, updates: Partial<GimmickEvent>) => void;
  onDelete: (id: string) => void;
}

export function PropertiesPanel({ gimmick, onChange, onDelete }: Props) {
  if (!gimmick) {
    return (
      <div style={{
        width: 200, background: '#12122a', borderLeft: '1px solid #2a2a4a',
        padding: 12, color: '#556', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        ギミックを選択してください
      </div>
    );
  }

  const upd = (updates: Partial<GimmickEvent>) => onChange(gimmick.id, updates);

  return (
    <div style={{
      width: 200, background: '#12122a', borderLeft: '1px solid #2a2a4a',
      padding: 10, overflowY: 'auto', fontSize: 12, color: '#ccd',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 8, color: '#aabbff' }}>
        {gimmick.type}
      </div>

      <Field label="ラベル">
        <input type="text" value={gimmick.label ?? ''} style={inputStyle}
          onChange={e => upd({ label: e.target.value })} />
      </Field>
      <Field label="発火タイム (s)">
        <input type="number" value={gimmick.time} min={0} step={0.5} style={inputStyle}
          onChange={e => upd({ time: +e.target.value })} />
      </Field>
      <Field label="警告時間 (s)">
        <input type="number" value={gimmick.warningDuration} min={0.5} step={0.5} style={inputStyle}
          onChange={e => upd({ warningDuration: +e.target.value })} />
      </Field>

      {/* 位置 */}
      {(gimmick.x !== undefined || gimmick.y !== undefined) && <>
        <Field label="X">
          <input type="number" value={gimmick.x ?? 320} step={10} style={inputStyle}
            onChange={e => upd({ x: +e.target.value })} />
        </Field>
        <Field label="Y">
          <input type="number" value={gimmick.y ?? 320} step={10} style={inputStyle}
            onChange={e => upd({ y: +e.target.value })} />
        </Field>
      </>}

      {/* ターゲット */}
      {gimmick.type === 'aoe_circle' && (
        <Field label="ターゲット">
          <select value={gimmick.target} style={inputStyle}
            onChange={e => upd({ target: e.target.value as GimmickEvent['target'] })}>
            <option value="fixed">固定</option>
            <option value="player">プレイヤー追尾</option>
          </select>
        </Field>
      )}

      {/* 円形 */}
      {(gimmick.type === 'aoe_circle' || gimmick.type === 'tower') && (
        <Field label="半径">
          <input type="number" value={gimmick.radius ?? gimmick.type === 'tower' ? (gimmick.radius ?? 55) : 100} min={10} step={10} style={inputStyle}
            onChange={e => upd({ radius: +e.target.value })} />
        </Field>
      )}

      {/* 直線 */}
      {gimmick.type === 'aoe_line' && <>
        <Field label="幅">
          <input type="number" value={gimmick.width ?? 80} min={10} step={10} style={inputStyle}
            onChange={e => upd({ width: +e.target.value })} />
        </Field>
        <Field label="長さ">
          <input type="number" value={gimmick.length ?? 400} min={50} step={20} style={inputStyle}
            onChange={e => upd({ length: +e.target.value })} />
        </Field>
        <Field label="角度 (deg)">
          <input type="number" value={Math.round((gimmick.angle ?? 0) * 180 / Math.PI)} step={15} style={inputStyle}
            onChange={e => upd({ angle: +e.target.value * Math.PI / 180 })} />
        </Field>
      </>}

      {/* 扇形 */}
      {gimmick.type === 'aoe_fan' && <>
        <Field label="方向 (deg)">
          <input type="number" value={Math.round((gimmick.angle ?? 0) * 180 / Math.PI)} step={15} style={inputStyle}
            onChange={e => upd({ angle: +e.target.value * Math.PI / 180 })} />
        </Field>
        <Field label="扇角度 (deg)">
          <input type="number" value={Math.round((gimmick.fanAngle ?? Math.PI / 3) * 180 / Math.PI)} min={10} max={359} step={15} style={inputStyle}
            onChange={e => upd({ fanAngle: +e.target.value * Math.PI / 180 })} />
        </Field>
        <Field label="長さ">
          <input type="number" value={gimmick.length ?? 300} min={50} step={20} style={inputStyle}
            onChange={e => upd({ length: +e.target.value })} />
        </Field>
      </>}

      {/* ドーナツ */}
      {gimmick.type === 'aoe_donut' && <>
        <Field label="内径（安全圏）">
          <input type="number" value={gimmick.innerRadius ?? 120} min={10} step={10} style={inputStyle}
            onChange={e => upd({ innerRadius: +e.target.value })} />
        </Field>
        <Field label="外径">
          <input type="number" value={gimmick.outerRadius ?? 400} min={50} step={10} style={inputStyle}
            onChange={e => upd({ outerRadius: +e.target.value })} />
        </Field>
      </>}

      {/* 頭割り */}
      {gimmick.type === 'stack' && <>
        <Field label="必要人数">
          <input type="number" value={gimmick.requiredCount ?? 2} min={1} max={8} style={inputStyle}
            onChange={e => upd({ requiredCount: +e.target.value })} />
        </Field>
        <Field label="判定半径">
          <input type="number" value={gimmick.stackRadius ?? 60} min={20} step={10} style={inputStyle}
            onChange={e => upd({ stackRadius: +e.target.value })} />
        </Field>
      </>}

      {/* 散開 */}
      {gimmick.type === 'spread' && <>
        <Field label="最小距離">
          <input type="number" value={gimmick.minDistance ?? 100} min={30} step={10} style={inputStyle}
            onChange={e => upd({ minDistance: +e.target.value })} />
        </Field>
        <Field label="表示半径">
          <input type="number" value={gimmick.spreadRadius ?? 60} min={20} step={10} style={inputStyle}
            onChange={e => upd({ spreadRadius: +e.target.value })} />
        </Field>
      </>}

      {/* 吹き飛ばし・引き寄せ */}
      {(gimmick.type === 'knockback' || gimmick.type === 'pull') && (
        <Field label="距離">
          <input type="number" value={gimmick.knockbackDistance ?? 200} min={10} step={20} style={inputStyle}
            onChange={e => upd({ knockbackDistance: +e.target.value })} />
        </Field>
      )}

      {/* 塔 */}
      {gimmick.type === 'tower' && (
        <Field label="必要人数">
          <input type="number" value={gimmick.towerRequiredCount ?? 1} min={1} max={8} style={inputStyle}
            onChange={e => upd({ towerRequiredCount: +e.target.value })} />
        </Field>
      )}

      <button
        onClick={() => onDelete(gimmick.id)}
        style={{
          marginTop: 16, width: '100%', padding: '6px 0', background: '#441122',
          color: '#ff6677', border: '1px solid #661133', borderRadius: 6, cursor: 'pointer', fontSize: 12,
        }}
      >
        削除
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 10, color: '#7788aa', marginBottom: 2 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '4px 6px', background: '#1e1e3a', color: '#ccd',
  border: '1px solid #3a3a5a', borderRadius: 4, fontSize: 12, boxSizing: 'border-box',
};
