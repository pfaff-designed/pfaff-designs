import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Molecules/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "highlight"],
    },
  },
  args: {
    variant: "default",
    children: (
      <>
        <CardHeader>
          <CardTitle>Warm, editorial card</CardTitle>
          <CardDescription>Supports case studies and proof points.</CardDescription>
        </CardHeader>
        <CardContent>
          The default card uses the cream surface with subtle border and generous spacing.
        </CardContent>
        <CardFooter>Footer actions or meta.</CardFooter>
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const Highlight: Story = {
  args: {
    variant: "highlight",
  },
};

