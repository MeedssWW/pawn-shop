const ASSET_FILES = Object.freeze({
  mine: "assets/mine-texture-atlas.png",
  pickaxes: "assets/pickaxe-sprites.png",
  ui: "assets/ui-icon-atlas.png",
  biomeSurface: "assets/biomes/surface.jpg",
  biomeSoil: "assets/biomes/soil.jpg",
  biomeStone: "assets/biomes/stone.jpg",
  biomeCrystal: "assets/biomes/crystal.jpg",
  biomeLava: "assets/biomes/lava.jpg",
  biomeCore: "assets/biomes/core.jpg",
});

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${source}`));
    image.src = source;
  });
}

export class AssetManager {
  constructor(baseUrl = document.baseURI) {
    this.urls = Object.fromEntries(
      Object.entries(ASSET_FILES).map(([key, file]) => [key, new URL(file, baseUrl).href]),
    );
    this.images = {};
  }

  async load() {
    const entries = await Promise.all(
      Object.entries(this.urls).map(async ([key, url]) => {
        try {
          return [key, await loadImage(url)];
        } catch {
          return [key, null];
        }
      }),
    );
    this.images = Object.fromEntries(entries);
    return this;
  }

  get(name) {
    return this.images[name];
  }
}
