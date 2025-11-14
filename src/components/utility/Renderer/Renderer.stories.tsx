import type { Meta, StoryObj } from "@storybook/react";
import { Renderer } from "./Renderer";
import type { PageJSON } from "./Renderer";

const meta: Meta<typeof Renderer> = {
  title: "Utility/Renderer",
  component: Renderer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Renderer>;

const exampleAboutJSON: PageJSON = {
  version: "1",
  page: {
    id: "story-about",
    kind: "query_response",
    blocks: [
      {
        id: "about-section",
        component: "ContentSection",
        props: {
          variant: "text-with-image",
          title: "About Me",
          description:
            "I'm a design engineer and creative technologist focused on building thoughtful, accessible digital experiences.",
          imageUrl:
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=539&h=918&q=60",
          imageAlt: "Portrait",
        },
      },
    ],
  },
};

const exampleGalleryJSON: PageJSON = {
  version: "1",
  page: {
    id: "story-gallery",
    kind: "query_response",
    blocks: [
      {
        id: "gallery-section",
        component: "ContentSection",
        props: {
          variant: "card-gallery",
          galleryImages: [
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 1",
            },
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 2",
            },
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 3",
            },
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 4",
            },
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 5",
            },
            {
              url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
              alt: "Gallery image 6",
            },
          ],
        },
      },
    ],
  },
};

const exampleNestedJSON: PageJSON = {
  version: "1",
  page: {
    id: "story-nested",
    kind: "query_response",
    blocks: [
      {
        id: "section-1",
        component: "Section",
        props: {
          variant: "default",
        },
        children: [
          {
            id: "container-1",
            component: "Container",
            props: {
              size: "default",
            },
            children: [
              {
                id: "heading-1",
                component: "Heading",
                props: {
                  text: "Example Section",
                  variant: "headline",
                },
              },
              {
                id: "body-1",
                component: "BodyText",
                props: {
                  body: "This is an example of nested components rendered by the Renderer.",
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

const exampleCardJSON: PageJSON = {
  version: "1",
  page: {
    id: "story-card",
    kind: "query_response",
    blocks: [
      {
        id: "section-card",
        component: "Section",
        props: {
          variant: "default",
        },
        children: [
          {
            id: "container-card",
            component: "Container",
            props: {
              size: "default",
            },
            children: [
              {
                id: "card-1",
                component: "Card",
                props: {
                  variant: "default",
                },
                children: [
                  {
                    id: "card-header-1",
                    component: "CardHeader",
                    children: [
                      {
                        id: "card-title-1",
                        component: "CardTitle",
                        props: {},
                        text: "Example Card",
                      },
                      {
                        id: "card-description-1",
                        component: "CardDescription",
                        props: {},
                        text: "This is a card description.",
                      },
                    ],
                  },
                  {
                    id: "card-content-1",
                    component: "CardContent",
                    children: [
                      {
                        id: "card-body-1",
                        component: "BodyText",
                        props: {
                          body: "This is the card content area with body text.",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    data: null,
  },
};

export const AboutSection: Story = {
  args: {
    data: exampleAboutJSON,
  },
};

export const GallerySection: Story = {
  args: {
    data: exampleGalleryJSON,
  },
};

export const NestedComponents: Story = {
  args: {
    data: exampleNestedJSON,
  },
};

export const CardExample: Story = {
  args: {
    data: exampleCardJSON,
  },
};

