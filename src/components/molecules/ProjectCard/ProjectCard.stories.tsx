import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProjectCard } from "./ProjectCard";
import { ProjectCardGrid } from "../ProjectCardGrid";

const meta: Meta<typeof ProjectCard> = {
  title: "Molecules/ProjectCard",
  component: ProjectCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["dark", "light"],
    },
    fillColor: {
      control: "select",
      options: ["default", "primary", "secondary", "yellow", "dark", "light"],
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProjectCard>;

export const Dark: Story = {
  args: {
    projectName: "Capital One Travel",
    client: "Capital One",
    projectType: "Travel Platform",
    variant: "dark",
    fillColor: "default",
    disabled: false,
  },
};

export const Light: Story = {
  args: {
    projectName: "Tanger Outlets",
    client: "Tanger Outlets",
    projectType: "Digital Experience",
    variant: "light",
    fillColor: "default",
    disabled: false,
  },
};

export const PrimaryFill: Story = {
  args: {
    projectName: "Capital One Travel",
    client: "Capital One",
    projectType: "Travel Platform",
    variant: "dark",
    fillColor: "primary",
    disabled: false,
  },
};

export const SecondaryFill: Story = {
  args: {
    projectName: "Tanger Outlets",
    client: "Tanger Outlets",
    projectType: "Digital Experience",
    variant: "light",
    fillColor: "secondary",
    disabled: false,
  },
};

export const YellowFill: Story = {
  args: {
    projectName: "Pfaff Designs",
    client: "Self-Initiated",
    projectType: "Generative UI",
    variant: "light",
    fillColor: "yellow",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    projectName: "Real Estate Platform",
    client: "Confidential Client",
    projectType: "In Development",
    variant: "dark",
    disabled: true,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <ProjectCardGrid
        cards={[
          {
            id: "1",
            projectName: "Capital One Travel",
            client: "Capital One",
            projectType: "Travel Platform",
            variant: "dark",
            fillColor: "default",
          },
          {
            id: "2",
            projectName: "Tanger Outlets",
            client: "Tanger Outlets",
            projectType: "Digital Experience",
            variant: "light",
            fillColor: "default",
          },
          {
            id: "3",
            projectName: "Pfaff Designs",
            client: "Self-Initiated",
            projectType: "Generative UI",
            variant: "dark",
            fillColor: "default",
          },
        ]}
      />
    </div>
  ),
};

