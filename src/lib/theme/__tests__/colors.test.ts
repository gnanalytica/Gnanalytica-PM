import { describe, it, expect } from 'vitest';
import { COLORS } from '../colors';

describe('Color Theme System', () => {
  describe('Light Mode Colors', () => {
    it('should have warm coral accent color', () => {
      expect(COLORS.light.accent).toBe('#FF6B35');
    });

    it('should have proper surface colors', () => {
      expect(COLORS.light.surface.primary).toBe('#FFFFFF');
      expect(COLORS.light.surface.secondary).toBe('#F5F3F0');
      expect(COLORS.light.surface.tertiary).toBe('#EEE8E3');
    });

    it('should have proper text colors', () => {
      expect(COLORS.light.text.primary).toBe('#1A1A1A');
      expect(COLORS.light.text.secondary).toBe('#6B5B52');
      expect(COLORS.light.text.muted).toBe('#7A6B60');
    });

    it('should have semantic colors with light variants', () => {
      expect(COLORS.light.semantic.success).toBe('#10B981');
      expect(COLORS.light.semantic.warning).toBe('#F59E0B');
      expect(COLORS.light.semantic.error).toBe('#EF4444');
      expect(COLORS.light.semantic.info).toBe('#3B82F6');
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
      expect(COLORS.dark.surface.primary).toBe('#1A1F2E');
      expect(COLORS.dark.surface.secondary).toBe('#2A2520');
      expect(COLORS.dark.surface.tertiary).toBe('#342F2A');
    });

    it('should have proper text colors', () => {
      expect(COLORS.dark.text.primary).toBe('#F5F3F0');
      expect(COLORS.dark.text.secondary).toBe('#B8AFA6');
      expect(COLORS.dark.text.muted).toBe('#8B7E77');
    });

    it('should have semantic colors with dark variants', () => {
      expect(COLORS.dark.semantic.success).toBe('#10B981');
      expect(COLORS.dark.semantic.warning).toBe('#F59E0B');
      expect(COLORS.dark.semantic.error).toBe('#EF4444');
      expect(COLORS.dark.semantic.info).toBe('#3B82F6');
    });

    it('should have soft semantic colors', () => {
      expect(COLORS.dark.semantic.successSoft).toBe('rgba(16, 185, 129, 0.1)');
      expect(COLORS.dark.semantic.warningSoft).toBe('rgba(245, 158, 11, 0.1)');
      expect(COLORS.dark.semantic.errorSoft).toBe('rgba(239, 68, 68, 0.1)');
      expect(COLORS.dark.semantic.infoSoft).toBe('rgba(59, 130, 246, 0.1)');
    });
  });

  describe('Shadows', () => {
    it('should have all shadow levels', () => {
      expect(COLORS.shadows.elevation0).toBeDefined();
      expect(COLORS.shadows.elevation1).toBeDefined();
      expect(COLORS.shadows.elevation2).toBeDefined();
      expect(COLORS.shadows.elevation3).toBeDefined();
      expect(COLORS.shadows.elevation4).toBeDefined();
    });

    it('should have layered shadow values', () => {
      expect(COLORS.shadows.elevation0).toBe('none');
      expect(COLORS.shadows.elevation1).toContain('rgba(0, 0, 0');
      expect(COLORS.shadows.elevation4).toContain('0 20px 25px');
    });
  });

  describe('Radius', () => {
    it('should have radius tokens', () => {
      expect(COLORS.radius.sm).toBe('8px');
      expect(COLORS.radius.md).toBe('12px');
      expect(COLORS.radius.lg).toBe('16px');
      expect(COLORS.radius.pill).toBe('9999px');
    });
  });
});
