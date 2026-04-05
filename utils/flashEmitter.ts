type FlashCallback = (color: string) => void;
let _handler: FlashCallback | null = null;

export function setFlashHandler(cb: FlashCallback | null) {
  _handler = cb;
}

export function triggerFlash(color: string) {
  _handler?.(color);
}
