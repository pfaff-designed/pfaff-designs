import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "./Container";

const meta: Meta<typeof Container> = {
  title: "Layout/Container",
  component: Container,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "narrow", "wide"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
  args: {
    children: (
      <div className="bg-accent-secondary p-8">
        <p>Default container (max-w-7xl)</p>
      </div>
    ),
  },
};

export const Narrow: Story = {
  args: {
    size: "narrow",
    children: (
      <div className="bg-accent-yellow p-8">
        <p>Narrow container (max-w-4xl)</p>
      </div>
    ),
  },
};

export const Wide: Story = {
  args: {
    size: "wide",
    children: (
      <div className="bg-state-success p-8 text-white">
        <p>Wide container (max-w-[1400px])</p>
      </div>
    ),
  },
};

