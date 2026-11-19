import { describe, expect, it } from 'vitest';

import { qrShape } from '@/lib/qr';

describe('qrShape', () => {
  it('draws a square code with its finder patterns', () => {
    const { size, path } = qrShape('TYxhMZN2FW6BUvHTyGDLc4Lbr5mRPCWFbd');
    expect((size - 17) % 4).toBe(0);
    // Top rows of the top-left and top-right finder patterns: seven dark modules each.
    expect(path.startsWith('M0 0h7v1h-7z')).toBe(true);
    expect(path).toContain(`M${size - 7} 0h7v1h-7z`);
  });

  it('is deterministic', () => {
    expect(qrShape('wxp://example')).toEqual(qrShape('wxp://example'));
  });
});
