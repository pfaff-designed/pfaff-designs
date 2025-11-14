import type { Meta, StoryObj } from "@storybook/react";
import { ContentBlock } from "./ContentBlock";

const meta: Meta<typeof ContentBlock> = {
  title: "Molecules/ContentBlock",
  component: ContentBlock,
  tags: ["autodocs"],
  argTypes: {
    headlineVariant: {
      control: "select",
      options: ["display", "h1", "h2", "h3"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContentBlock>;

export const SingleItem: Story = {
  args: {
    headline: "AI for Streamlining Development",
    items: [
      {
        eyebrow: "Problem",
        body: "Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects.It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression.",
      },
    ],
  },
};

export const MultipleItems: Story = {
  args: {
    headline: "AI for Streamlining Development",
    items: [
      {
        eyebrow: "Problem",
        body: "Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression.",
      },
      {
        eyebrow: "Solution",
        body: "We built a comprehensive design system with reusable components, clear documentation, and flexible patterns that enable teams to build consistent experiences faster.",
      },
      {
        eyebrow: "Results",
        body: "Since launching, we've seen a 40% reduction in design-to-development handoff time and 95% adoption across product teams.",
      },
    ],
  },
};

export const WithoutEyebrow: Story = {
  args: {
    headline: "Design System Foundation",
    items: [
      {
        body: "Building a comprehensive design system requires careful planning, attention to detail, and a deep understanding of both design principles and development constraints. Our approach combines visual consistency with technical flexibility.",
      },
    ],
  },
};

export const MixedItems: Story = {
  args: {
    headline: "Project Overview",
    items: [
      {
        eyebrow: "Challenge",
        body: "Creating a design system that serves multiple products across different platforms presents unique challenges. We must balance consistency with flexibility, ensure accessibility compliance, and maintain performance standards.",
      },
      {
        eyebrow: "Impact",
        body: "The new system reduced development time by 40% while improving overall product quality and user experience consistency. The new system reduced development time by 40% while improving overall product quality and user experience consistency.",
      },
    ],
  },
};

export const H2Variant: Story = {
  args: {
    headline: "Our Approach to Design",
    headlineVariant: "h2",
    items: [
      {
        eyebrow: "Methodology",
        body: "We believe in creating systems that empower teams to build better products faster. By providing clear guidelines, reusable components, and comprehensive documentation, we enable designers and developers to focus on solving user problems rather than reinventing the wheel.",
      },
    ],
  },
};

export const H3Variant: Story = {
  args: {
    headline: "Component Architecture",
    headlineVariant: "h3",
    items: [
      {
        eyebrow: "Technical",
        body: "Our component library is built with React and TypeScript, ensuring type safety and developer experience. Each component is thoroughly documented, tested, and designed to work seamlessly within the system.",
      },
    ],
  },
};

export const LongContent: Story = {
  args: {
    headline: "Building for Scale and Accessibility",
    items: [
      {
        eyebrow: "Challenge",
        body: "Creating a design system that serves multiple products across different platforms presents unique challenges. We must balance consistency with flexibility, ensure accessibility compliance, maintain performance standards, and provide clear documentation. Our solution addresses these challenges through a combination of atomic design principles, comprehensive testing strategies, and continuous iteration based on team feedback.",
      },
    ],
  },
};

