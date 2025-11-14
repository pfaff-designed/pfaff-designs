import type { Meta, StoryObj } from "@storybook/react";
import { Metric } from "./Metric";

const meta: Meta<typeof Metric> = {
  title: "Atoms/Metric",
  component: Metric,
  tags: ["autodocs"],
  args: {
    label: "Conversion",
    value: "42%",
  },
};

export default meta;
type Story = StoryObj<typeof Metric>;

export const Default: Story = {};

export const Positive: Story = {
  args: {
    variant: "positive",
    value: "98%",
  },
};

