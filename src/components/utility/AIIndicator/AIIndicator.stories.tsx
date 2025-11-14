import type { Meta, StoryObj } from "@storybook/react";
import { AIIndicator } from "./AIIndicator";
import { BodyText } from "@/components/atoms/BodyText";

const meta: Meta<typeof AIIndicator> = {
  title: "Utility/AIIndicator",
  component: AIIndicator,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AIIndicator>;

export const Default: Story = {
  args: {
    label: "AI‑generated",
  },
};

export const CustomLabel: Story = {
  args: {
    label: "Generated Content",
  },
};

export const WithContent: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <BodyText body="This content was generated using AI assistance." />
        <AIIndicator />
      </div>
    </div>
  ),
};

export const Inline: Story = {
  render: () => (
    <div>
      <BodyText
        body="This is regular content. "
        className="inline"
      />
      <AIIndicator className="inline-flex" />
      <BodyText
        body=" The indicator appears inline with the text."
        className="inline"
      />
    </div>
  ),
};

