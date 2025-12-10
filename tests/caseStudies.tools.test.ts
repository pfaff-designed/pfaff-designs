import { getToolsForCaseStudy } from "@/lib/caseStudies/tools";

describe("getToolsForCaseStudy", () => {
  it("capital one returns expected tools", async () => {
    const tools = await getToolsForCaseStudy("capital-one-travel");
    expect(tools).toEqual(expect.arrayContaining(["React", "TypeScript"]));
  });
});

