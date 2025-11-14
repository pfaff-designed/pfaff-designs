import type { Meta, StoryObj } from "@storybook/react";
import { ContentSection } from "./ContentSection";

const meta: Meta<typeof ContentSection> = {
  title: "Page Components/ContentSection",
  component: ContentSection,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "2-column-split",
        "full-width",
        "2-column-image-right",
        "2-column-image-left",
        "card-gallery",
        "text-with-image",
        "annotated-visual",
        "half-and-half-column",
        "timeline",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContentSection>;

export const FullWidth: Story = {
  args: {
    variant: "full-width",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
    imageAlt: "Background image",
    title: "Capital One",
    subtitle: "Subtitle",
    quote: "THIS IS A HIGH LEVEL SUMMARY I helped build a travel booking platform that improved conversion by 15%.",
    projectDetails: {
      client: "Capital One",
      role: "Developer",
      year: "2024-2025",
    },
  },
};

export const TwoColumnImageRight: Story = {
  args: {
    variant: "2-column-image-right",
    title: "Content with Image Right",
    contentBlocks: [
      {
        headline: "Design System Implementation",
        items: [
          {
            eyebrow: "Approach",
            body: "Our design system approach focuses on creating reusable components that maintain consistency while allowing for creative flexibility. We've built a comprehensive library that serves multiple products and platforms.",
          },
        ],
      },
    ],
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&h=400&q=60",
    imageAlt: "Design system components",
  },
};

export const TwoColumnImageLeft: Story = {
  args: {
    variant: "2-column-image-left",
    title: "Content with Image Left",
    contentBlocks: [
      {
        headline: "Visual Design Process",
        items: [
          {
            eyebrow: "Methodology",
            body: "Our visual design process begins with understanding user needs and business goals. Through research, iteration, and collaboration, we create solutions that are both beautiful and functional.",
          },
        ],
      },
    ],
    imageUrl: "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=600&h=400&q=60",
    imageAlt: "Design process visualization",
  },
};

export const CardGallery: Story = {
  args: {
    variant: "card-gallery",
    galleryImages: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 1",
      },
      {
        url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 2",
      },
      {
        url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 3",
      },
      {
        url: "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 4",
      },
      {
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 5",
      },
      {
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=60",
        alt: "Gallery image 6",
      },
    ],
  },
};

export const TextWithImage: Story = {
  args: {
    variant: "text-with-image",
    title: "Headline for Case Study Story Telling",
    description:
      "Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=539&h=918&q=60",
    imageAlt: "Case study visualization",
  },
};

export const AnnotatedVisual: Story = {
  args: {
    variant: "annotated-visual",
    title: "Layout 6: \"Annotated Visual\"",
    description:
      "Columns: 12\n\nContent: Image with numbered or labeled callouts\n\nUse for:\n\nComponent breakdowns\nDiagrams\nDesign explanations\n\nRules:\n\nImage spans 10 cols, centered.\nUse numbered annotations or side callout lines (cols 1–2).\nMaintain equal padding around visual (min 48px).\n\nVisual feel: Analytical, clear, instructional.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1382&h=918&q=60",
    imageAlt: "Annotated visual",
  },
};

export const HalfAndHalfColumn: Story = {
  args: {
    variant: "half-and-half-column",
    leftImageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
    leftImageAlt: "Before state",
    leftLabel: "Before",
    leftContent:
      "Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression.",
    rightImageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=60",
    rightImageAlt: "After state",
    rightLabel: "After",
    rightContent:
      "Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression. Pfaff Design System is a shared visual language that bridges design and code for all pfaff.design projects. It ensures consistency, efficiency, and accessibility across experiences while keeping space for creative expression.",
  },
};

export const Timeline: Story = {
  args: {
    variant: "timeline",
    title: "Project Timeline",
    description: "Key milestones and achievements throughout the project lifecycle",
    timelineItems: [
      {
        year: "2024 Q1",
        title: "Project Initiation",
        description:
          "Initial research and discovery phase. Conducted user interviews, analyzed existing systems, and established project goals and success metrics.",
      },
      {
        year: "2024 Q2",
        title: "Design Development",
        description:
          "Created initial design concepts, developed the design system foundation, and established component patterns. Conducted multiple design reviews and iterations.",
      },
      {
        year: "2024 Q3",
        title: "Implementation",
        description:
          "Built the component library, implemented the design system across platforms, and conducted thorough testing. Began user acceptance testing.",
      },
      {
        year: "2024 Q4",
        title: "Launch & Optimization",
        description:
          "Launched the new system, monitored performance metrics, and gathered user feedback. Implemented optimizations and refinements based on real-world usage.",
      },
    ],
  },
};

