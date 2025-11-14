import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./Button";

const EqualizerGlyph = () => (
  <span
    aria-hidden="true"
    className="flex h-5 w-5 items-end justify-center gap-[2px]"
  >
    <span className="h-3 w-[3px] rounded-full bg-[var(--color-dark)]" />
    <span className="h-4 w-[3px] rounded-full bg-[var(--color-dark)]" />
    <span className="h-2 w-[3px] rounded-full bg-[var(--color-dark)]" />
    <span className="h-4 w-[3px] rounded-full bg-[var(--color-dark)]" />
  </span>
);

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "destructive",
        "continue",
        "outline",
        "icon",
        "inline",
      ],
    },
  },
  args: {
    children: "Click me",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Continue: Story = {
  args: {
    variant: "continue",
    children: "Continue",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Icon: Story = {
  args: {
    variant: "icon",
    "aria-label": "Audio toggle",
  },
  render: (args) => (
    <Button {...args}>
      <EqualizerGlyph />
    </Button>
  ),
};

export const Inline: Story = {
  args: {
    variant: "inline",
    children: "Learn more",
  },
};

