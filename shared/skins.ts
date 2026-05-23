export interface SkinTheme {
  id: string;
  name: string;
  price: number;          // JPY
  stripeProductId: string;
  // CSS custom properties
  vars: {
    bgDeep:      string;
    bgPanel:     string;
    bgInset:     string;
    border:      string;
    green:       string;
    greenDim:    string;
    amber:       string;
    text:        string;
    textBright:  string;
    scanOpacity: string;
  };
}

export const SKINS: SkinTheme[] = [
  {
    id: "default",
    name: "Standard Issue",
    price: 0,
    stripeProductId: "",
    vars: {
      bgDeep:      "#030508",
      bgPanel:     "#080c10",
      bgInset:     "#050809",
      border:      "#1a2530",
      green:       "#00cc66",
      greenDim:    "#004422",
      amber:       "#cc8800",
      text:        "#7a9aaa",
      textBright:  "#c0d8e0",
      scanOpacity: "0.04",
    },
  },
  {
    id: "kriegsmarine",
    name: "Kriegsmarine",
    price: 380,
    stripeProductId: "prod_kriegsmarine",
    vars: {
      bgDeep:      "#020305",
      bgPanel:     "#06090e",
      bgInset:     "#040708",
      border:      "#1e2a18",
      green:       "#88cc44",
      greenDim:    "#2a3a10",
      amber:       "#bb9900",
      text:        "#8a9a7a",
      textBright:  "#c8d4b0",
      scanOpacity: "0.05",
    },
  },
  {
    id: "royal_navy",
    name: "Royal Navy",
    price: 380,
    stripeProductId: "prod_royalnavy",
    vars: {
      bgDeep:      "#020408",
      bgPanel:     "#060a14",
      bgInset:     "#040608",
      border:      "#1a2240",
      green:       "#4488ff",
      greenDim:    "#0a1840",
      amber:       "#dd9900",
      text:        "#7a8aaa",
      textBright:  "#b0c4e8",
      scanOpacity: "0.04",
    },
  },
  {
    id: "modern",
    name: "Modern Warfare",
    price: 480,
    stripeProductId: "prod_modern",
    vars: {
      bgDeep:      "#020204",
      bgPanel:     "#050508",
      bgInset:     "#030306",
      border:      "#222230",
      green:       "#00ffcc",
      greenDim:    "#003322",
      amber:       "#ff8800",
      text:        "#6a8a9a",
      textBright:  "#a0d0e0",
      scanOpacity: "0.03",
    },
  },
];

export function getSkin(id: string): SkinTheme {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function applySkin(skin: SkinTheme): void {
  const root = document.documentElement;
  const v = skin.vars;
  root.style.setProperty("--bg-deep",      v.bgDeep);
  root.style.setProperty("--bg-panel",     v.bgPanel);
  root.style.setProperty("--bg-inset",     v.bgInset);
  root.style.setProperty("--border",       v.border);
  root.style.setProperty("--green",        v.green);
  root.style.setProperty("--green-dim",    v.greenDim);
  root.style.setProperty("--amber",        v.amber);
  root.style.setProperty("--text",         v.text);
  root.style.setProperty("--text-bright",  v.textBright);
}

export function loadSkin(): void {
  const id = localStorage.getItem("skin") ?? "default";
  applySkin(getSkin(id));
}

export function saveSkin(id: string): void {
  localStorage.setItem("skin", id);
  applySkin(getSkin(id));
}
