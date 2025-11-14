import type { Meta, StoryObj } from "@storybook/react";
import { TextareaWithButton } from "./TextareaWithButton";

const meta: Meta<typeof TextareaWithButton> = {
  title: "Molecules/TextareaWithButton",
  component: TextareaWithButton,
  tags: ["autodocs"],
  args: {
    placeholder: "Type your message here",
    buttonText: "Send message",
  },
};

export default meta;
type Story = StoryObj<typeof TextareaWithButton>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here",
    buttonText: "Send message",
  },
};

export const WithValue: Story = {
  args: {
    placeholder: "Type your message here",
    value: "This is my message that I want to send to the support team.",
    buttonText: "Send message",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Type your message here",
    disabled: true,
    buttonDisabled: true,
    buttonText: "Send message",
  },
};

export const CustomButtonText: Story = {
  args: {
    placeholder: "Type your message here",
    buttonText: "Submit feedback",
  },
};

