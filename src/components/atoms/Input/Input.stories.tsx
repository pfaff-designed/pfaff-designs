import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";
import { InputWithButton } from "@/components/molecules/InputWithButton";

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Email",
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Email",
  },
};

export const WithValue: Story = {
  args: {
    value: "pietro.schirano@gmail.com",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Email",
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: "Email",
    value: "invalid-email",
  },
};

export const WithButton: Story = {
  render: () => (
    <InputWithButton
      placeholder="Email"
      buttonText="Subscribe"
      onButtonClick={() => alert("Subscribed!")}
    />
  ),
};

