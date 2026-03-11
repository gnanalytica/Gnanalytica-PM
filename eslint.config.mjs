import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // React Compiler optimization hints — downgrade to warnings.
      // These flag valid patterns (hydration guards, timers) that the compiler
      // can't auto-optimize, but they work correctly at runtime.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // TanStack Virtual returns unstable refs by design; nothing to fix.
      "react-hooks/incompatible-library": "off",
    },
  },
];

export default eslintConfig;
