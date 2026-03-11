import { describe, it, expect } from 'vitest';
import { TYPOGRAPHY } from '../typography';

describe('Typography System', () => {
  describe('Heading Sizes', () => {
    it('should have Heading 1 with 32px and Bold weight', () => {
      expect(TYPOGRAPHY.h1.fontSize).toBe('32px');
      expect(TYPOGRAPHY.h1.fontWeight).toBe(700);
    });

    it('should have Heading 1 with line-height 1.2', () => {
      expect(TYPOGRAPHY.h1.lineHeight).toBe(1.2);
    });

    it('should have Heading 2 with 24px and Bold weight', () => {
      expect(TYPOGRAPHY.h2.fontSize).toBe('24px');
      expect(TYPOGRAPHY.h2.fontWeight).toBe(700);
    });

    it('should have Heading 2 with line-height 1.25', () => {
      expect(TYPOGRAPHY.h2.lineHeight).toBe(1.25);
    });

    it('should have Heading 3 with 18px and Semibold weight', () => {
      expect(TYPOGRAPHY.h3.fontSize).toBe('18px');
      expect(TYPOGRAPHY.h3.fontWeight).toBe(600);
    });

    it('should have Heading 3 with line-height 1.3', () => {
      expect(TYPOGRAPHY.h3.lineHeight).toBe(1.3);
    });
  });

  describe('Body Text Sizes', () => {
    it('should have Body Large with 16px and Regular weight', () => {
      expect(TYPOGRAPHY.bodyLarge.fontSize).toBe('16px');
      expect(TYPOGRAPHY.bodyLarge.fontWeight).toBe(400);
    });

    it('should have Body Large with line-height 1.5', () => {
      expect(TYPOGRAPHY.bodyLarge.lineHeight).toBe(1.5);
    });

    it('should have Body Regular with 14px and Regular weight', () => {
      expect(TYPOGRAPHY.bodyRegular.fontSize).toBe('14px');
      expect(TYPOGRAPHY.bodyRegular.fontWeight).toBe(400);
    });

    it('should have Body Regular with line-height 1.5', () => {
      expect(TYPOGRAPHY.bodyRegular.lineHeight).toBe(1.5);
    });

    it('should have Body Small with 13px and Regular weight', () => {
      expect(TYPOGRAPHY.bodySmall.fontSize).toBe('13px');
      expect(TYPOGRAPHY.bodySmall.fontWeight).toBe(400);
    });

    it('should have Body Small with line-height 1.4', () => {
      expect(TYPOGRAPHY.bodySmall.lineHeight).toBe(1.4);
    });
  });

  describe('Label and Caption', () => {
    it('should have Label with 12px and Semibold weight', () => {
      expect(TYPOGRAPHY.label.fontSize).toBe('12px');
      expect(TYPOGRAPHY.label.fontWeight).toBe(600);
    });

    it('should have Label with line-height 1.3', () => {
      expect(TYPOGRAPHY.label.lineHeight).toBe(1.3);
    });

    it('should have Caption with 11px and Regular weight', () => {
      expect(TYPOGRAPHY.caption.fontSize).toBe('11px');
      expect(TYPOGRAPHY.caption.fontWeight).toBe(400);
    });

    it('should have Caption with line-height 1.3', () => {
      expect(TYPOGRAPHY.caption.lineHeight).toBe(1.3);
    });
  });

  describe('Font Family', () => {
    it('should use Inter for all typography styles', () => {
      expect(TYPOGRAPHY.h1.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.h2.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.h3.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.bodyLarge.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.bodyRegular.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.bodySmall.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.label.fontFamily).toBe('Inter');
      expect(TYPOGRAPHY.caption.fontFamily).toBe('Inter');
    });
  });
});
