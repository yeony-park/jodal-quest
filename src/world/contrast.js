import { ctx } from "./canvas.js";

// A dark outer edge separates the bright inner edge from light surfaces.
export const interactableColors = { bright: "#fff2a6", edge: "#172f35" };

export function outlineRect(x, y, w, h) {
  ctx.strokeStyle = interactableColors.edge;
  ctx.lineWidth = 6;
  ctx.strokeRect(Math.round(x), Math.round(y), w, h);
  ctx.strokeStyle = interactableColors.bright;
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(x), Math.round(y), w, h);
}

export function contrastRatio(a, b) {
  const luminance = hex => {
    const c = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v,16)/255)
      .map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
    return c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
  };
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
