import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta: Meta<typeof Footer> = {
  title: "Page Components/Footer",
  component: Footer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "#26291d",
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};

export const WithCustomLinks: Story = {
  args: {
    links: [
      { label: "reachable", href: "#" },
      { label: "m-f / 10-4", href: "#" },
      { label: "github", href: "https://github.com" },
      { label: "linkedin", href: "https://linkedin.com" },
      { label: "twitter", href: "https://twitter.com" },
    ],
  },
};

export const WithCtaHandler: Story = {
  args: {
    ctaLabel: "Get in touch",
    onCtaClick: () => {
      alert("CTA button clicked!");
    },
  },
};

export const Minimal: Story = {
  args: {
    links: [{ label: "reachable", href: "#" }],
  },
};

