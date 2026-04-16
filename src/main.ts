import * as Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { ReplayScene } from './game/scenes/ReplayScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: '#0d0d1a',
  parent: 'game-container',
  input: {
    gamepad: true,
  },
  scene: [BootScene, GameScene, ReplayScene],
};

new Phaser.Game(config);
