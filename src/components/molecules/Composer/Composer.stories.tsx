import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Composer } from "./Composer";

const meta: Meta<typeof Composer> = {
  title: "Molecules/Composer",
  component: Composer,
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
    },
    onSubmit: {
      action: "submitted",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Composer>;

export const Default: Story = {
  args: {
    placeholder: "Tell me about yourself",
  },
};

export const WithRecentQuery: Story = {
  args: {
    placeholder: "Tell me about yourself",
    recentQuery: "Tell me about yourself",
    recentResponse:
      "efficiency, and accessibility across experiences while keeping space for creative expression.",
  },
};

export const Interactive: Story = {
  args: {
    placeholder: "Ask me anything...",
  },
  render: (args) => {
    const [recentQuery, setRecentQuery] = React.useState<string | undefined>();
    const [recentResponse, setRecentResponse] = React.useState<string | undefined>();

    const handleSubmit = (query: string) => {
      setRecentQuery(query);
      // Simulate a response
      setTimeout(() => {
        setRecentResponse(
          `This is a simulated response to: "${query}". The AI would process your query here.`
        );
      }, 500);
    };

    return (
      <Composer
        {...args}
        onSubmit={handleSubmit}
        recentQuery={recentQuery}
        recentResponse={recentResponse}
      />
    );
  },
};
