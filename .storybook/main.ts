import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-docs",
    "@storybook/addon-webpack5-compiler-swc",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname, "../src"),
      };
    }

    // Configure PostCSS for CSS files
    // Webpack processes loaders right-to-left, so postcss-loader must come AFTER css-loader in the array
    const rules = config.module?.rules;
    if (rules) {
      rules.forEach((rule: any) => {
        if (
          rule &&
          typeof rule === "object" &&
          rule.test &&
          rule.test.toString().includes("css") &&
          !rule.test.toString().includes("module")
        ) {
          // Check if this rule already has postcss-loader
          const hasPostcssLoader = rule.use?.some(
            (loader: any) =>
              (typeof loader === "string" && loader.includes("postcss")) ||
              (typeof loader === "object" && loader.loader?.includes("postcss"))
          );

          if (!hasPostcssLoader && rule.use && Array.isArray(rule.use)) {
            // Find css-loader index
            const cssLoaderIndex = rule.use.findIndex(
              (loader: any) =>
                (typeof loader === "string" && loader.includes("css-loader")) ||
                (typeof loader === "object" &&
                  (loader.loader?.includes("css-loader") || loader === "css-loader"))
            );

            if (cssLoaderIndex !== -1) {
              // Insert postcss-loader right after css-loader in the array
              // This makes it run BEFORE css-loader (right-to-left processing)
              rule.use.splice(cssLoaderIndex + 1, 0, {
                loader: require.resolve("postcss-loader"),
                options: {
                  postcssOptions: {
                    config: path.resolve(__dirname, "../postcss.config.js"),
                  },
                },
              });
            }
          }
        }
      });
    }

    return config;
  },
};

export default config;

