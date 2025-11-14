import type { Meta, StoryObj } from "@storybook/react";
import { ImageContainer } from "./ImageContainer";

const meta: Meta<typeof ImageContainer> = {
  title: "Atoms/ImageContainer",
  component: ImageContainer,
  tags: ["autodocs"],
  argTypes: {
    aspectRatio: {
      control: "select",
      options: ["auto", "square", "video", "portrait", "landscape", "wide"],
    },
    objectFit: {
      control: "select",
      options: ["cover", "contain", "fill", "none", "scale-down"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageContainer>;

export const WithImage: Story = {
  args: {
    imageSrc: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
    alt: "Sample image",
    aspectRatio: "landscape",
  },
};

export const Placeholder: Story = {
  args: {
    alt: "Image placeholder",
    aspectRatio: "landscape",
  },
};

export const Square: Story = {
  args: {
    imageSrc: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
    alt: "Square image",
    aspectRatio: "square",
  },
};

export const Video: Story = {
  args: {
    imageSrc: "https://via.placeholder.com/800x450",
    alt: "Video aspect ratio",
    aspectRatio: "video",
  },
};

export const Portrait: Story = {
  args: {
    imageSrc: "https://via.placeholder.com/600x800",
    alt: "Portrait image",
    aspectRatio: "portrait",
  },
};

export const Wide: Story = {
  args: {
    imageSrc: "https://via.placeholder.com/1600x900",
    alt: "Wide image",
    aspectRatio: "wide",
  },
};

export const Auto: Story = {
  args: {
    imageSrc: "https://via.placeholder.com/800x600",
    alt: "Auto aspect ratio",
    aspectRatio: "auto",
  },
};

export const Contain: Story = {
  args: {
    imageSrc: "https://via.placeholder.com/800x600",
    alt: "Contain fit",
    aspectRatio: "landscape",
    objectFit: "contain",
  },
};

