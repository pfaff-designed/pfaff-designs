import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "./Divider";
import { BodyText } from "@/components/atoms/BodyText";

const meta: Meta<typeof Divider> = {
  title: "Utility/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div>
      <BodyText body="Content above the divider." />
      <Divider />
      <BodyText body="Content below the divider." />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-32 items-center gap-4">
      <BodyText body="Left content" />
      <Divider orientation="vertical" />
      <BodyText body="Right content" />
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div>
      <BodyText body="First section" />
      <Divider />
      <BodyText body="Second section" />
      <Divider />
      <BodyText body="Third section" />
    </div>
  ),
};

