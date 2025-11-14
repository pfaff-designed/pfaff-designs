import type { Meta, StoryObj } from "@storybook/react";
import { FormField, FormFieldInput, FormFieldSelect, FormFieldTextarea } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const InputField: Story = {
  render: () => (
    <FormField label="Full name" helpText="Share your preferred name.">
      <FormFieldInput placeholder="Alex Pfaff" />
    </FormField>
  ),
};

export const TextareaField: Story = {
  render: () => (
    <FormField label="Project summary" helpText="2–3 sentences." required>
      <FormFieldTextarea placeholder="Describe the project…" rows={4} />
    </FormField>
  ),
};

export const SelectField: Story = {
  render: () => (
    <FormField label="Focus area">
      <FormFieldSelect>
        <option value="">Select focus</option>
        <option value="design">Design Engineering</option>
        <option value="frontend">Front-End</option>
        <option value="systems">Systems</option>
      </FormFieldSelect>
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField label="Email" error="Please use your work email.">
      <FormFieldInput placeholder="name@company.com" error />
    </FormField>
  ),
};

