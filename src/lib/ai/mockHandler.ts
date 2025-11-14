import type { PageJSON } from "@/components/utility/Renderer";

/**
 * Mock Query Handler
 * Returns example JSON based on user queries
 * This will be replaced with the real AI pipeline later
 */
export const handleQuery = async (query: string): Promise<PageJSON> => {
  const normalizedQuery = query.toLowerCase().trim();

  // Generate a unique ID for this response
  const responseId = `response-${Date.now()}`;

  // Simple query matching - can be extended
  if (normalizedQuery.includes("gallery") || normalizedQuery.includes("images")) {
    return {
      version: "1",
      page: {
        id: responseId,
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
  }

  if (
    normalizedQuery.includes("about") ||
    normalizedQuery.includes("yourself") ||
    normalizedQuery.includes("who are you")
  ) {
    return {
      version: "1",
      page: {
        id: responseId,
        kind: "query_response",
        blocks: [
          {
            id: "about-section",
            component: "ContentSection",
            props: {
              variant: "text-with-image",
              title: "About Me",
              description:
                "I'm a design engineer and creative technologist focused on building thoughtful, accessible digital experiences. I work at the intersection of design and code, creating systems that are both beautiful and functional.",
              imageUrl:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=539&h=918&q=60",
              imageAlt: "Portrait",
            },
          },
        ],
      },
    };
  }

  if (normalizedQuery.includes("work") || normalizedQuery.includes("projects") || normalizedQuery.includes("portfolio")) {
    return {
      version: "1",
      page: {
        id: responseId,
        kind: "query_response",
        blocks: [
          {
            id: "work-section",
            component: "Section",
            props: {
              variant: "default",
            },
            children: [
              {
                id: "work-container",
                component: "Container",
                props: {
                  size: "default",
                },
                children: [
                  {
                    id: "work-heading",
                    component: "Heading",
                    props: {
                      text: "Selected Work",
                      variant: "display",
                    },
                  },
                  {
                    id: "work-content",
                    component: "ContentSection",
                    props: {
                      variant: "2-column-image-right",
                      contentBlocks: [
                        {
                          headline: "Capital One Travel",
                          headlineVariant: "headline",
                          items: [
                            {
                              eyebrow: "Role",
                              body: "Design Engineer",
                            },
                            {
                              eyebrow: "Year",
                              body: "2023",
                            },
                            {
                              body: "A modular rewards-focused travel platform built with React and TypeScript.",
                            },
                          ],
                        },
                      ],
                      imageUrl:
                        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60",
                      imageAlt: "Capital One Travel project",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };
  }

  // Default response - simple text section
  return {
    version: "1",
    page: {
      id: responseId,
      kind: "query_response",
      blocks: [
        {
          id: "default-section",
          component: "Section",
          props: {
            variant: "default",
          },
          children: [
            {
              id: "default-container",
              component: "Container",
              props: {
                size: "default",
              },
              children: [
                {
                  id: "default-heading",
                  component: "Heading",
                  props: {
                    text: "Response",
                    variant: "headline",
                  },
                },
                {
                  id: "default-body",
                  component: "BodyText",
                  props: {
                    body: `You asked: "${query}". This is a mock response. Try asking about "gallery", "about yourself", or "work" to see different component layouts.`,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };
};

