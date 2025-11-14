import type { Meta, StoryObj } from "@storybook/react";
import { BodyText } from "./BodyText";

const meta: Meta<typeof BodyText> = {
  title: "Atoms/BodyText",
  component: BodyText,
  tags: ["autodocs"],
  args: {
    body: "An approachable, editorial tone that remains highly readable.",
  },
};

export default meta;
type Story = StoryObj<typeof BodyText>;

export const Default: Story = {};

export const Muted: Story = {
  args: {
    variant: "muted",
    body: "Muted copy for supporting details or captions.",
  },
};

export const Small: Story = {
  args: {
    variant: "small",
    body: "Small text for meta information and timestamps.",
  },
};

