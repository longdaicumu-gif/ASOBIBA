import * as Phaser from 'phaser';
import type { StageData } from '../../types';

// Phase1動作確認用のサンプルステージ
const SAMPLE_STAGE: StageData = {
  meta: { title: 'サンプルステージ', author: 'system', version: '0.1.0' },
  arena: { width: 640, height: 640 },
  aiMembers: [],
  timeline: [
    {
      id: 'aoe1',
      type: 'aoe_circle',
      time: 4.0,
      warningDuration: 3.0,
      target: 'fixed',
      x: 320,
      y: 200,
      radius: 120,
    },
    {
      id: 'aoe2',
      type: 'aoe_circle',
      time: 7.0,
      warningDuration: 2.5,
      target: 'player', // プレイヤー追尾
      radius: 100,
    },
    {
      id: 'aoe3',
      type: 'aoe_circle',
      time: 10.0,
      warningDuration: 2.0,
      target: 'fixed',
      x: 160,
      y: 480,
      radius: 130,
    },
    {
      id: 'aoe4',
      type: 'aoe_circle',
      time: 10.0,
      warningDuration: 2.0,
      target: 'fixed',
      x: 480,
      y: 480,
      radius: 130,
    },
  ],
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(width / 2, height / 2 - 60, 'ASOBIBA', {
      fontSize: '48px',
      color: '#00ccff',
      stroke: '#003355',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, 'FF14ギミック練習ゲーム', {
      fontSize: '18px',
      color: '#aaaacc',
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height / 2 + 80, '[ SPACE / Aボタン ] でスタート', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 点滅
    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // スタート入力待ち
    this.input.keyboard?.addKey('SPACE').on('down', () => this.startGame());

    // ゲームパッドAボタン
    this.input.gamepad?.on('down', (_pad: unknown, button: { index: number }) => {
      if (button.index === 0) this.startGame(); // PS5の×ボタン
    });
  }

  private startGame() {
    this.scene.start('GameScene', { stageData: SAMPLE_STAGE });
  }
}
