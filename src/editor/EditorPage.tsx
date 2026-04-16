import { useReducer, useCallback } from 'react';
import type { StageData, GimmickEvent, GimmickType } from '../types';
import { GimmickPalette } from './components/GimmickPalette';
import { ArenaCanvas } from './components/ArenaCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { BLANK_STAGE } from './sampleStages';

// ─── State ───────────────────────────────────────────────────────────────────

interface EditorState {
  stageData: StageData;
  selectedId: string | null;
}

type EditorAction =
  | { type: 'SELECT';    id: string | null }
  | { type: 'ADD';       gimmick: GimmickEvent }
  | { type: 'UPDATE';    id: string; updates: Partial<GimmickEvent> }
  | { type: 'DELETE';    id: string }
  | { type: 'LOAD';      stageData: StageData }
  | { type: 'SET_TITLE'; title: string };

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selectedId: action.id };
    case 'ADD':
      return {
        ...state,
        selectedId: action.gimmick.id,
        stageData: {
          ...state.stageData,
          timeline: [...state.stageData.timeline, action.gimmick],
        },
      };
    case 'UPDATE':
      return {
        ...state,
        stageData: {
          ...state.stageData,
          timeline: state.stageData.timeline.map(ev =>
            ev.id === action.id ? { ...ev, ...action.updates } : ev
          ),
        },
      };
    case 'DELETE':
      return {
        selectedId: null,
        stageData: {
          ...state.stageData,
          timeline: state.stageData.timeline.filter(ev => ev.id !== action.id),
        },
      };
    case 'LOAD':
      return { stageData: action.stageData, selectedId: null };
    case 'SET_TITLE':
      return {
        ...state,
        stageData: {
          ...state.stageData,
          meta: { ...state.stageData.meta, title: action.title },
        },
      };
    default:
      return state;
  }
}

// デフォルト値
const DEFAULTS: Record<GimmickType, Partial<GimmickEvent>> = {
  aoe_circle:  { radius: 100, warningDuration: 2.5, target: 'fixed' },
  aoe_line:    { width: 80, length: 400, angle: Math.PI / 2, warningDuration: 2.5, target: 'fixed' },
  aoe_fan:     { fanAngle: Math.PI / 3, length: 300, angle: 0, warningDuration: 2.5, target: 'fixed' },
  aoe_donut:   { innerRadius: 130, outerRadius: 400, warningDuration: 2.5, target: 'fixed' },
  stack:       { requiredCount: 3, stackRadius: 70, warningDuration: 3, target: 'player' },
  spread:      { minDistance: 100, spreadRadius: 65, warningDuration: 3, target: 'player' },
  knockback:   { knockbackDistance: 220, warningDuration: 2.5, target: 'fixed' },
  pull:        { knockbackDistance: 180, warningDuration: 2.5, target: 'fixed' },
  tower:       { radius: 55, towerRequiredCount: 1, warningDuration: 3, target: 'fixed' },
};

// 最後のギミック発火時間
function maxTime(timeline: GimmickEvent[]) {
  return timeline.reduce((m, e) => Math.max(m, e.time), 0) + 5;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  initialStage?: StageData;
  onTest: (stageData: StageData) => void;
  onBack: () => void;
}

export function EditorPage({ initialStage, onTest, onBack }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    stageData: initialStage ?? BLANK_STAGE,
    selectedId: null,
  });

  const { stageData, selectedId } = state;
  const selected = stageData.timeline.find(e => e.id === selectedId) ?? null;

  // ギミック追加（ドロップ）
  const handleDrop = useCallback((type: GimmickType, x: number, y: number) => {
    const nextTime = maxTime(stageData.timeline) - 4; // 少し手前に
    const id = `${type}_${Date.now()}`;
    const gimmick: GimmickEvent = {
      id, type,
      time: Math.max(3, nextTime),
      x, y,
      label: type,
      ...DEFAULTS[type],
    } as GimmickEvent;
    dispatch({ type: 'ADD', gimmick });
  }, [stageData.timeline]);

  // アリーナでドラッグ移動
  const handleMove = useCallback((id: string, x: number, y: number) => {
    dispatch({ type: 'UPDATE', id, updates: { x, y } });
  }, []);

  // セーブ（JSONダウンロード）
  const handleSave = () => {
    const json = JSON.stringify(stageData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stageData.meta.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ロード（JSONファイル）
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as StageData;
          dispatch({ type: 'LOAD', stageData: data });
        } catch {
          alert('JSONファイルの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0d0d1a', color: '#ccd',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'sans-serif', overflow: 'hidden',
    }}>
      {/* ── ツールバー ── */}
      <div style={{
        height: 44, background: '#12122a', borderBottom: '1px solid #2a2a4a',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flexShrink: 0,
      }}>
        <button onClick={onBack} style={btnStyle('#334')}>← 戻る</button>
        <input
          value={stageData.meta.title}
          onChange={e => dispatch({ type: 'SET_TITLE', title: e.target.value })}
          style={{
            background: '#1a1a33', color: '#ccd', border: '1px solid #3a3a5a',
            borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 200,
          }}
        />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#556' }}>
          ギミック {stageData.timeline.length}個
        </span>
        <button onClick={handleLoad} style={btnStyle('#223344')}>ロード</button>
        <button onClick={handleSave} style={btnStyle('#223344')}>保存</button>
        <button
          onClick={() => onTest(stageData)}
          style={btnStyle('#114433', '#00ffaa')}
        >
          ▶ テストプレイ
        </button>
      </div>

      {/* ── メインエリア ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* パレット */}
        <GimmickPalette onDragStart={() => {}} />

        {/* アリーナ */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0d0d1a', overflow: 'hidden',
        }}>
          <div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#446', marginBottom: 6 }}>
              ドラッグしてギミックを配置 / クリックして選択 / タイムラインでタイミング調整
            </div>
            <ArenaCanvas
              stageData={stageData}
              selectedId={selectedId}
              onSelect={id => dispatch({ type: 'SELECT', id })}
              onMove={handleMove}
              onDrop={handleDrop}
            />
          </div>
        </div>

        {/* プロパティ */}
        <PropertiesPanel
          gimmick={selected}
          onChange={(id, updates) => dispatch({ type: 'UPDATE', id, updates })}
          onDelete={id => dispatch({ type: 'DELETE', id })}
        />
      </div>

      {/* ── タイムライン ── */}
      <Timeline
        timeline={stageData.timeline}
        selectedId={selectedId}
        totalDuration={maxTime(stageData.timeline)}
        onSelect={id => dispatch({ type: 'SELECT', id })}
        onUpdateTime={(id, time) => dispatch({ type: 'UPDATE', id, updates: { time } })}
      />
    </div>
  );
}

function btnStyle(bg: string, color = '#aabbcc'): React.CSSProperties {
  return {
    padding: '5px 12px', background: bg, color, border: `1px solid ${color}44`,
    borderRadius: 5, cursor: 'pointer', fontSize: 12,
  };
}
