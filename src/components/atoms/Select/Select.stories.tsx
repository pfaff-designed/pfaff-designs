import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    children: (
      <>
        <option value="">Choose an option</option>
        <option value="design">Design Engineering</option>
        <option value="frontend">Front-End</option>
        <option value="systems">Systems</option>
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    error: true,
  },
};

