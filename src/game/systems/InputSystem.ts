import * as Phaser from 'phaser';

export interface InputState {
  dx: number; // -1〜1
  dy: number; // -1〜1
}

export class InputSystem {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> = {};
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  getInput(): InputState {
    let dx = 0;
    let dy = 0;

    // キーボード
    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.left?.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.wasd.right?.isDown) dx += 1;
      if (this.cursors.up.isDown || this.wasd.up?.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.wasd.down?.isDown) dy += 1;
    }

    // ゲームパッド（PS5コントローラーなど）
    const pad = this.scene.input.gamepad?.getPad(0);
    if (pad) {
      const lx = pad.leftStick.x;
      const ly = pad.leftStick.y;
      const deadzone = 0.15;
      if (Math.abs(lx) > deadzone) dx += lx;
      if (Math.abs(ly) > deadzone) dy += ly;

      // 十字キー
      if (pad.left) dx -= 1;
      if (pad.right) dx += 1;
      if (pad.up) dy -= 1;
      if (pad.down) dy += 1;
    }

    // 正規化（斜め移動が速くならないよう）
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }

    return { dx, dy };
  }
}
