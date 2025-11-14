import type { Meta, StoryObj } from "@storybook/react";
import { NavItem } from "./NavItem";

const meta: Meta<typeof NavItem> = {
  title: "Molecules/NavItem",
  component: NavItem,
  tags: ["autodocs"],
  args: {
    href: "#",
    children: "Case Studies",
  },
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};

export const NavigationRow: Story = {
  render: () => (
    <nav className="flex gap-6 border-b border-[rgba(38,41,29,0.12)] pb-3">
      <NavItem href="#work" active>
        Work
      </NavItem>
      <NavItem href="#writing">Writing</NavItem>
      <NavItem href="#about">About</NavItem>
    </nav>
  ),
};

