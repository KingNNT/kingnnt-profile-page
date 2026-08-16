import next from "eslint-config-next";

const eslintConfig = [
  { ignores: [".next/**", "next-env.d.ts", "coverage/**"] },
  ...next,
  {
    // Test doubles for `next/image` legitimately render a raw `<img>`.
    files: ["tests/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
];

export default eslintConfig;
