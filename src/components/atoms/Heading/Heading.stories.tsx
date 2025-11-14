import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Atoms/Heading",
  component: Heading,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["display", "hero", "headline", "subheading", "h1", "h2", "h3"],
    },
  },
  args: {
    text: "Intentional, editorial typography",
    variant: "headline",
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Display: Story = {
  args: {
    text: "Display 64/72",
    variant: "display",
  },
};

export const Hero: Story = {
  args: {
    text: "Hero",
    variant: "hero",
  },
};

export const Headline: Story = {
  args: {
    text: "Headline",
    variant: "headline",
  },
};

export const Subheading: Story = {
  args: {
    text: "Subheading",
    variant: "subheading",
  },
};

export const H1: Story = {
  args: {
    text: "H1 Major 4th",
    variant: "h1",
  },
};

export const H2: Story = {
  args: {
    text: "H2 Major 4th",
    variant: "h2",
  },
};

export const H3: Story = {
  args: {
    text: "H3 Major 4th",
    variant: "h3",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Heading text="Display 64/72" variant="display" />
      <Heading text="Hero" variant="hero" />
      <Heading text="Headline" variant="headline" />
      <Heading text="Subheading" variant="subheading" />
      <Heading text="H1 Major 4th" variant="h1" />
      <Heading text="H2 Major 4th" variant="h2" />
      <Heading text="H3 Major 4th" variant="h3" />
    </div>
  ),
};

