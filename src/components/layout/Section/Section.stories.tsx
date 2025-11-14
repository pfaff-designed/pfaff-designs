import type { Meta, StoryObj } from "@storybook/react";
import { Section } from "./Section";
import { Heading } from "@/components/atoms/Heading";
import { BodyText } from "@/components/atoms/BodyText";

const meta: Meta<typeof Section> = {
  title: "Layout/Section",
  component: Section,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["light", "dark", "default"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  args: {
    variant: "default",
    children: (
      <div className="mx-auto max-w-4xl px-5">
        <Heading text="Section Title" level={2} className="mb-4" />
        <BodyText
          body="This is a default section with standard background and padding. Sections provide consistent vertical spacing between content blocks."
        />
      </div>
    ),
  },
};

export const Light: Story = {
  args: {
    variant: "light",
    children: (
      <div className="mx-auto max-w-4xl px-5">
        <Heading text="Light Section" level={2} className="mb-4" />
        <BodyText
          body="This section uses a light surface background for visual contrast."
        />
      </div>
    ),
  },
};

export const Dark: Story = {
  args: {
    variant: "dark",
    children: (
      <div className="mx-auto max-w-4xl px-5">
        <Heading text="Dark Section" level={2} className="mb-4" />
        <BodyText
          body="This section uses a dark background with light text for emphasis."
        />
      </div>
    ),
  },
};

