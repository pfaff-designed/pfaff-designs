import type { Meta, StoryObj } from "@storybook/react";
import { InputWithButton } from "./InputWithButton";

const meta: Meta<typeof InputWithButton> = {
  title: "Molecules/InputWithButton",
  component: InputWithButton,
  tags: ["autodocs"],
  args: {
    placeholder: "Email",
    buttonText: "Subscribe",
  },
};

export default meta;
type Story = StoryObj<typeof InputWithButton>;

export const Default: Story = {
  args: {
    placeholder: "Email",
    buttonText: "Subscribe",
  },
};

export const WithValue: Story = {
  args: {
    placeholder: "Email",
    value: "pietro.schirano@gmail.com",
    buttonText: "Subscribe",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Email",
    disabled: true,
    buttonDisabled: true,
    buttonText: "Subscribe",
  },
};

export const CustomButtonText: Story = {
  args: {
    placeholder: "Enter your name",
    buttonText: "Submit",
  },
};

export const LongButtonText: Story = {
  args: {
    placeholder: "Email",
    buttonText: "Get Started",
  },
};

