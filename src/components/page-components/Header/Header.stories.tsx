import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Page Components/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {},
};

export const WithCustomLinks: Story = {
  args: {
    links: [
      { label: "About", href: "/about", active: false },
      { label: "Work", href: "/work", active: true },
      { label: "Writing", href: "/writing", active: false },
    ],
  },
};

export const WithContactHandler: Story = {
  args: {
    contactLabel: "Get in touch",
    onContactClick: () => {
      alert("Contact button clicked!");
    },
  },
};

export const Minimal: Story = {
  args: {
    links: [{ label: "About", href: "/about" }],
  },
};

