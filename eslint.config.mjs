import next from "eslint-config-next";

const eslintConfig = [{ ignores: [".next/**", "next-env.d.ts", "coverage/**"] }, ...next];

export default eslintConfig;
