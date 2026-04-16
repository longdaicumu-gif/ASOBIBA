import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import type { StageData } from './types';
import { GameScene } from './game/scenes/GameScene';
import { ReplayScene } from './game/scenes/ReplayScene';
import { eventBus } from './game/eventBus';

interface Props {
  stageData: StageData;
  onExit: () => void;
}

export function GameWrapper({ stageData, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      backgroundColor: '#0d0d1a',
      parent: containerRef.current,
      input: { gamepad: true },
      scene: [GameScene, ReplayScene],
    });

    // 最初のシーンを GameScene で開始
    game.events.once('ready', () => {
      game.scene.start('GameScene', { stageData });
    });

    gameRef.current = game;

    const handleExit = () => onExit();
    eventBus.on('game:exit', handleExit);

    return () => {
      eventBus.off('game:exit', handleExit);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a' }}
    />
  );
}
