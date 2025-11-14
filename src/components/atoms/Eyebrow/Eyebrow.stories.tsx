import type { Meta, StoryObj } from "@storybook/react";
import { Eyebrow } from "./Eyebrow";

const meta: Meta<typeof Eyebrow> = {
  title: "Atoms/Eyebrow",
  component: Eyebrow,
  tags: ["autodocs"],
  args: {
    text: "Section Label",
  },
};

export default meta;
type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = {};

