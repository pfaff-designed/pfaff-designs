import type { Meta, StoryObj } from "@storybook/react";
import { Stack } from "./Stack";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Stack> = {
  title: "Layout/Stack",
  component: Stack,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    gap: {
      control: { type: "select" },
      options: [1, 2, 3, 4, 6, 9, 12, 18, 24],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Default: Story = {
  args: {
    gap: 6,
    children: (
      <>
        <Heading text="Stacked Content" level={2} />
        <BodyText body="First item in the stack with default gap spacing." />
        <BodyText body="Second item demonstrating consistent vertical spacing." />
        <BodyText body="Third item to show the stack layout pattern." />
      </>
    ),
  },
};

export const SmallGap: Story = {
  args: {
    gap: 3,
    children: (
      <>
        <Heading text="Tight Stack" level={3} />
        <BodyText body="Items with smaller gap spacing." />
        <BodyText body="More compact vertical rhythm." />
      </>
    ),
  },
};

export const LargeGap: Story = {
  args: {
    gap: 12,
    children: (
      <>
        <Heading text="Spacious Stack" level={2} />
        <BodyText body="Items with larger gap spacing for more breathing room." />
        <BodyText body="Generous vertical spacing creates a calm, editorial feel." />
      </>
    ),
  },
};

export const WithBadges: Story = {
  args: {
    gap: 9,
    children: (
      <>
        <Heading text="Skills" level={3} />
        <div className="flex flex-wrap gap-2">
          <Badge>React</Badge>
          <Badge>TypeScript</Badge>
          <Badge>Next.js</Badge>
        </div>
        <BodyText body="Skills displayed in a stack layout with consistent spacing." />
      </>
    ),
  },
};

