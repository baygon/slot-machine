import { Container, Sprite, Assets } from "pixi.js";

export class Symbol extends Container {
  private sprite: Sprite;
  public symbolId: string;

  constructor(symbolId: string, size: number) {
    super();
    this.symbolId = symbolId;

    this.sprite = new Sprite(Assets.get(symbolId));
    this.sprite.width = size;
    this.sprite.height = size;
    this.sprite.anchor.set(0.5);

    this.sprite.x = size / 2;
    this.sprite.y = size / 2;

    this.addChild(this.sprite);
  }

  public updateSymbol(newSymbolId: string): void {
    this.symbolId = newSymbolId;
    this.sprite.texture = Assets.get(newSymbolId);
  }
}
