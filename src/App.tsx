import { useState } from 'react';
import type { StageData } from './types';
import { GameWrapper } from './GameWrapper';
import { EditorPage } from './editor/EditorPage';
import { DEMO_STAGE } from './editor/sampleStages';

type AppMode = 'menu' | 'game' | 'editor';

export function App() {
  const [mode, setMode] = useState<AppMode>('menu');
  const [currentStage, setCurrentStage] = useState<StageData>(DEMO_STAGE);

  const playStage = (stage: StageData) => {
    setCurrentStage(stage);
    setMode('game');
  };

  if (mode === 'game') {
    return <GameWrapper stageData={currentStage} onExit={() => setMode('menu')} />;
  }

  if (mode === 'editor') {
    return (
      <EditorPage
        initialStage={currentStage}
        onTest={stage => playStage(stage)}
        onBack={() => setMode('menu')}
      />
    );
  }

  // ── タイトル画面 ──
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0d0d1a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', color: '#ccd', gap: 0,
    }}>
      {/* ロゴ */}
      <div style={{ fontSize: 64, fontWeight: 'bold', color: '#00ccff', letterSpacing: 6, textShadow: '0 0 30px #00ccff88' }}>
        ASOBIBA
      </div>
      <div style={{ fontSize: 16, color: '#7799bb', marginBottom: 60, letterSpacing: 2 }}>
        FF14ギミック練習ゲーム
      </div>

      {/* ボタン群 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 280 }}>
        <MenuButton
          label="▶  全ギミック体験（デモ）"
          color="#00ccff"
          bg="#001a2a"
          onClick={() => playStage(DEMO_STAGE)}
        />
        <MenuButton
          label="🎮  自由プレイ（ブランク）"
          color="#00aa88"
          bg="#001a14"
          onClick={() => playStage({
            meta: { title: '自由プレイ', author: '', version: '0.1' },
            arena: { width: 640, height: 640 },
            aiMembers: [],
            timeline: [],
          })}
        />
        <MenuButton
          label="✏️  ステージエディター"
          color="#bbaaff"
          bg="#12122a"
          onClick={() => setMode('editor')}
        />
      </div>

      {/* 操作説明 */}
      <div style={{ marginTop: 48, fontSize: 12, color: '#446', lineHeight: 1.8, textAlign: 'center' }}>
        WASD / 矢印キー で移動　|　PS5コントローラー対応<br />
        ESC でタイトルに戻る　|　R でリトライ
      </div>
    </div>
  );
}

function MenuButton({
  label, color, bg, onClick,
}: {
  label: string; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 24px', background: bg, color,
        border: `2px solid ${color}66`, borderRadius: 10,
        cursor: 'pointer', fontSize: 14, textAlign: 'left',
        transition: 'all 0.2s',
        boxShadow: `0 0 0 0 ${color}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 0 16px ${color}44`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${color}66`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {label}
    </button>
  );
}
