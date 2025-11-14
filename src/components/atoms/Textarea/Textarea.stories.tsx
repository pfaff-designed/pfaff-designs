import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";
import { TextareaWithButton } from "@/components/molecules/TextareaWithButton";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    placeholder: "Type your message here",
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here",
  },
};

export const WithValue: Story = {
  args: {
    value: "This is a sample message that has been typed into the textarea.",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Type your message here",
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: "Type your message here",
    value: "This message has an error",
  },
};

export const WithButton: Story = {
  render: () => (
    <TextareaWithButton
      placeholder="Type your message here"
      buttonText="Send message"
      onButtonClick={() => alert("Message sent!")}
    />
  ),
};

