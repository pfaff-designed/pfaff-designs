import type { Meta, StoryObj } from "@storybook/react";
import { Spacer } from "./Spacer";
import { BodyText } from "@/components/atoms/BodyText";

const meta: Meta<typeof Spacer> = {
  title: "Utility/Spacer",
  component: Spacer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: [3, 6, 9, 12, 18, 24, 36],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const Default: Story = {
  render: () => (
    <div>
      <BodyText body="Content above the spacer." />
      <Spacer />
      <BodyText body="Content below the spacer." />
    </div>
  ),
};

export const Small: Story = {
  render: () => (
    <div>
      <BodyText body="Small spacing above (12px)." />
      <Spacer size={3} />
      <BodyText body="Small spacing below." />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div>
      <BodyText body="Large spacing above (96px)." />
      <Spacer size={24} />
      <BodyText body="Large spacing below." />
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div>
      <BodyText body="First section" />
      <Spacer size={12} />
      <BodyText body="Second section (48px spacing)" />
      <Spacer size={18} />
      <BodyText body="Third section (72px spacing)" />
    </div>
  ),
};

