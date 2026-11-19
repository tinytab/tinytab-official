import { encode } from 'uqr';

export interface QrShape {
  /** Modules per side, without a quiet zone; the caller pads the code. */
  size: number;
  /** SVG path of the dark modules in a `size` × `size` view box, one rectangle per horizontal run. */
  path: string;
}

/** Highest error correction: a logo covers the centre, and the code must still scan from a photo of the screen. */
export function qrShape(text: string): QrShape {
  const { data, size } = encode(text, { ecc: 'H', border: 0 });
  let path = '';
  data.forEach((row, y) => {
    for (let x = 0; x < size; x++) {
      if (!row[x]) {
        continue;
      }
      const start = x;
      while (row[x + 1]) {
        x++;
      }
      path += `M${start} ${y}h${x - start + 1}v1h${start - x - 1}z`;
    }
  });
  return { size, path };
}
