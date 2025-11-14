import type { Meta, StoryObj } from "@storybook/react";
import { MediaCard } from "./MediaCard";

const meta: Meta<typeof MediaCard> = {
  title: "Molecules/MediaCard",
  component: MediaCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MediaCard>;

export const Default: Story = {
  args: {
    image: {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
      alt: "Case study visual",
    },
    eyebrow: "Product Design",
    heading: "Designing an AI-first workflow",
    body: "A systems-level look at how we reduced iteration time by 42% through intent-driven tooling.",
    tags: ["AI Systems", "Design Engineering", "Front-End"],
  },
};

export const Highlight: Story = {
  args: {
    ...Default.args,
    variant: "highlight",
    heading: "Featured case study",
  },
};

