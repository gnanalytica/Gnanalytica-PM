import { describe, it, expect } from 'vitest';
import { COLORS } from '../colors';

describe('Color Theme System', () => {
  describe('Light Mode Colors', () => {
    it('should have warm coral accent color', () => {
      expect(COLORS.light.accent).toBe('#FF6B35');
    });

    it('should have proper surface colors', () => {
      expect(COLORS.light.surface.primary).toBe('#ffffff');
      expect(COLORS.light.surface.secondary).toBe('#fafbfc');
      expect(COLORS.light.surface.tertiary).toBe('#f3f4f6');
    });

    it('should have proper text colors', () => {
      expect(COLORS.light.text.primary).toBe('#0f172a');
      expect(COLORS.light.text.secondary).toBe('#475569');
      expect(COLORS.light.text.muted).toBe('#7A6B60');
    });

    it('should have semantic colors with light variants', () => {
      expect(COLORS.light.semantic.success).toBe('#10b981');
      expect(COLORS.light.semantic.warning).toBe('#f59e0b');
      expect(COLORS.light.semantic.error).toBe('#ef4444');
      expect(COLORS.light.semantic.info).toBe('#3b82f6');
    });

    it('should have soft semantic colors', () => {
      expect(COLORS.light.semantic.successSoft).toBe('rgba(16, 185, 129, 0.1)');
      expect(COLORS.light.semantic.warningSoft).toBe('rgba(245, 158, 11, 0.1)');
      expect(COLORS.light.semantic.errorSoft).toBe('rgba(239, 68, 68, 0.1)');
      expect(COLORS.light.semantic.infoSoft).toBe('rgba(59, 130, 246, 0.1)');
    });
  });

  describe('Dark Mode Colors', () => {
    it('should have warm coral accent color for dark mode', () => {
      expect(COLORS.dark.accent).toBe('#FF8557');
    });

    it('should have proper surface colors', () => {
      expect(COLORS.dark.surface.primary).toBe('#0f1117');
      expect(COLORS.dark.surface.secondary).toBe('#171923');
      expect(COLORS.dark.surface.tertiary).toBe('#1e2030');
    });

    it('should have proper text colors', () => {
      expect(COLORS.dark.text.primary).toBe('rgba(255, 255, 255, 0.92)');
      expect(COLORS.dark.text.secondary).toBe('rgba(226, 232, 240, 0.6)');
      expect(COLORS.dark.text.muted).toBe('rgba(226, 232, 240, 0.35)');
    });

    it('should have semantic colors with dark variants', () => {
      expect(COLORS.dark.semantic.success).toBe('#34d399');
      expect(COLORS.dark.semantic.warning).toBe('#fbbf24');
      expect(COLORS.dark.semantic.error).toBe('#f87171');
      expect(COLORS.dark.semantic.info).toBe('#60a5fa');
    });

    it('should have soft semantic colors', () => {
      expect(COLORS.dark.semantic.successSoft).toBe('rgba(52, 211, 153, 0.12)');
      expect(COLORS.dark.semantic.warningSoft).toBe('rgba(251, 191, 36, 0.12)');
      expect(COLORS.dark.semantic.errorSoft).toBe('rgba(248, 113, 113, 0.12)');
      expect(COLORS.dark.semantic.infoSoft).toBe('rgba(96, 165, 250, 0.12)');
    });
  });

  describe('Shadows', () => {
    it('should have all shadow levels', () => {
      expect(COLORS.shadows.xs).toBeDefined();
      expect(COLORS.shadows.sm).toBeDefined();
      expect(COLORS.shadows.md).toBeDefined();
      expect(COLORS.shadows.lg).toBeDefined();
      expect(COLORS.shadows.overlay).toBeDefined();
    });

    it('should have layered shadow values', () => {
      expect(COLORS.shadows.xs).toBe('0 1px 2px rgba(0, 0, 0, 0.03)');
      expect(COLORS.shadows.sm).toContain('rgba(0, 0, 0');
      expect(COLORS.shadows.lg).toContain('0 8px 24px');
    });
  });

  describe('Spacing', () => {
    it('should have radius tokens', () => {
      expect(COLORS.spacing.radiusSm).toBe('6px');
      expect(COLORS.spacing.radiusMd).toBe('8px');
      expect(COLORS.spacing.radiusLg).toBe('12px');
      expect(COLORS.spacing.radiusXl).toBe('16px');
    });
  });
});
