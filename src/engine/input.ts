import type { InputState } from './types';

export class InputManager {
  state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    shift: false,
  };

  private spacePressed = false;
  private shiftPressed = false;

  onSpacePress?: () => void;
  onShiftPress?: () => void;

  constructor() {
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.state.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.state.down = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = true;
        break;
      case 'Space':
        if (!this.spacePressed) {
          this.spacePressed = true;
          this.onSpacePress?.();
        }
        this.state.space = true;
        e.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.shiftPressed) {
          this.shiftPressed = true;
          this.onShiftPress?.();
        }
        this.state.shift = true;
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.state.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.state.down = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = false;
        break;
      case 'Space':
        this.spacePressed = false;
        this.state.space = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.shiftPressed = false;
        this.state.shift = false;
        break;
    }
  };
}
