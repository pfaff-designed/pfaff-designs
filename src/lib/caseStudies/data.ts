import type { CaseStudyPage } from "./types";

/**
 * Case Study Data
 * Static data for case study pages
 */

export const caseStudies: CaseStudyPage[] = [
  {
    slug: "capital-one-travel",
    client: "Capital One",
    projectName: "Capital One",
    url: "https://capitalonetravel.com/",
    timeframe: "2023 to 2024",
    heroSummary:
      "I worked on Capital One Travel across several phases of the product, contributing to components and pages that needed to support new content and new priorities as the platform grew. One ongoing challenge was expanding the site as Capital One opened new airport lounges. My work focused on building templates and components that made it possible to roll out new lounge pages without reinventing the structure each time. The goal was to create UI that felt cohesive, stable, and simple to extend as new locations launched.",
    roleSummary:
      "Front-End Engineer",
    sections: [
      {
        id: "context",
        eyebrow: "Context",
        heading: "Creating Structure Inside a Changing System",
        body: "Capital One Travel evolved through many short development cycles, often with different teams contributing at different times. That history left the interface with a mix of patterns that did not always follow the same rules. My work happened inside that environment across several iterations of the product. The lounge expansion was one example, but the larger effort was about building new pieces that fit naturally within the system that was already in place.\n\nWhen new lounges opened, each page needed its own content and layout, but it also had to feel like part of the same experience. The challenge was working within the patterns that existed while strengthening the areas where the system had started to drift.",
      },
      {
        id: "role",
        eyebrow: "Role",
        heading: "Making New Work Feel Like Part of the System",
        body: "My role was to build components and layouts that could support the platform as it expanded. Sometimes that meant shaping new pages for lounge launches. Other times it meant refining existing patterns so future contributors could work more smoothly. Across the different iterations I worked on, the through-line was the same. I needed to understand how the system behaved, which parts were reliable, and where updates would make the experience more consistent.\n\nThe work was not about producing large, complex features. It was about making thoughtful adjustments to the interface so new additions felt natural, and so the system became a little easier to work with over time.",
      },
      {
        id: "approach",
        eyebrow: "Approach",
        heading: "Working With What the System Already Gives You",
        body: "Each cycle of work began with reading the existing system. The product had gone through many updates, so the first step was understanding which patterns were still solid and which ones had started to drift. I spent time tracing components, checking how they behaved across the site, and identifying the inconsistencies that caused friction for design, QA, and engineering.\n\nRather than rebuilding everything, I looked for ways to use the structure that was already there. When launching a new lounge page, the question was how to build it so it fit the system and would not create more complexity for the next launch. This often meant adjusting layout primitives, tightening spacing rules, or reusing established interactions so the new work felt native to the interface.\n\nAcross the different iterations, the approach stayed consistent. Smooth the rough edges, strengthen the reusable pieces, and leave the system more predictable than it was before.",
      },
      {
        id: "impact",
        eyebrow: "Impact",
        heading: "Making the Product Easier to Extend",
        body: "The work made the site easier to update as new lounges and new content rolled out. The templates and components we put in place reduced the amount of one-off development needed for each launch, and the interface began behaving more consistently across different pages.\n\nSmall improvements added up. Aligning spacing rules reduced design and engineering drift. Reusing interaction patterns gave QA fewer variations to track. Cleaning up older components made the system more predictable for anyone working in it later.\n\nOver time, the experience became steadier. New additions fit more naturally, and the product handled expansion without creating extra friction for the teams involved.",
      },
      {
        id: "takeaway",
        eyebrow: "Takeaway",
        heading: "Seeing the System as Part of the Work",
        body: "Working on Capital One Travel gave me a clearer sense of how much the small engineering decisions shape the long-term health of a product. Details like how a layout scales, how a component handles edge cases, or how patterns stay aligned across pages can determine whether a system grows smoothly or becomes harder to maintain. When those details are handled well, people do not think about them. The experience simply works.\n\nThis project helped me understand the value of building with the future in mind. It showed me how much I care about creating systems that stay stable as a product grows.",
      },
    ],
  },
  {
    slug: "pmi",
    client: "PMI (Project Management Institute)",
    projectName: "PMI - Project Management Institute",
    url: "https://www.pmi.org/certifications/agile-acp",
    timeframe: "2023",
    heroSummary:
      "PMI is a globally recognized organization in the project management and agile certification space. They needed a refreshed site for their Agile Certified Practitioner (ACP) program that communicated the value of the certification in a clear and trustworthy way.",
    roleSummary:
      "Engineer",
    sections: [
      {
        id: "overview",
        eyebrow: "Overview",
        heading: "Certification clarity",
        body: "PMI is a globally recognized organization in the project management and agile certification space. They needed a refreshed site for their Agile Certified Practitioner (ACP) program that communicated the value of the certification in a clear and trustworthy way. The experience had to support users across a wide range of backgrounds, devices, and levels of familiarity with agile methods.",
      },
      {
        id: "role",
        eyebrow: "Role & Scope",
        heading: "Design translation",
        body: "The project was delivered through AKQA, where I worked alongside designers, art directors, project managers, and back-end engineers to build a responsive and accessible experience. My role centered on front-end engineering and design translation, turning Figma concepts into reliable components and layouts.",
      },
      {
        id: "process",
        eyebrow: "Process",
        heading: "Modular thinking",
        body: "I started by reviewing the designs with the creative team to ensure that the intended interactions were feasible and could be built cleanly. As I developed the components, I collaborated closely with designers to refine spacing, hierarchy, and layout details. My workflow centered on modular components, predictable state handling, and strong accessibility practices.",
      },
      {
        id: "impact",
        eyebrow: "Impact",
        heading: "Clearer communication",
        body: "The updated site improved clarity around PMI's Agile certification and delivered a more modern, responsive experience. The components proved reusable and maintainable for future updates, and the final build aligned with PMI's visual and accessibility standards. The redesign made it easier for users to understand the certification value and navigate the information confidently.",
      },
    ],
  },
  {
    slug: "tanger-outlets",
    client: "Tanger",
    projectName: "Tanger",
    url: "https://www.tanger.com/",
    timeframe: "2022",
    heroSummary:
      "Tanger was redesigning its entire platform, and the work reached deep into the system architecture. I contributed by building front-end components, fixing bugs, and helping wire the middleware that translated third-party deal data into predictable formats for the UI.",
    roleSummary:
      "Front-End Engineer",
    sections: [
      {
        id: "context",
        eyebrow: "Context",
        heading: "A redesign that reached beneath the surface",
        body: "Tanger was going through more than a visual refresh. Behind the scenes, the team was rebuilding the architecture that powered the entire site. The old platform relied on static pages with inconsistent structures. The new approach required a flexible system built around structured content, reusable components, and integrations with external data sources.\n\nIt was the kind of project where the real progress happened underneath the surface. The front end could only succeed if the architecture behind it was stable and consistent.",
      },
      {
        id: "problem",
        eyebrow: "Problem",
        heading: "Building the interface while the system took shape",
        body: "My role focused on the front end, but the front end depended on systems that were still evolving. Components needed predictable data and consistent patterns, and the site relied on a third-party service for deals and coupon information. That data had to be shaped by a middleware layer before it could reach the UI.\n\nI worked with the engineering team to help wire that middleware, shape the data flowing into the components, and make sure the interface behaved reliably as the system settled into place.",
      },
      {
        id: "process",
        eyebrow: "Process",
        heading: "Front-end components, bug fixes, and middleware integration",
        body: "Much of my work centered on building and refining components while the underlying architecture was still in flux. I implemented UI elements, fixed bugs, tested edge cases, and worked closely with the design team to make sure interactions matched the intended experience.\n\nI also collaborated with backend engineers to connect the middleware to the third-party deals service. This included mapping incoming data, resolving mismatches, and verifying that the components rendered correctly across different scenarios.\n\nEven early in my career, this project gave me experience at the intersection of system logic and interface behavior. The front end needed clarity, but the system underneath needed stability, and I was part of helping those two sides meet.",
      },
      {
        id: "outcomes",
        eyebrow: "Outcomes",
        heading: "A stronger system and a clearer understanding of architecture",
        body: "The redesigned platform moved Tanger from a collection of static pages to a scalable architecture built around structured content and reusable components. My work helped stabilize the integration between the middleware and the UI, and contributed to a system that is easier to maintain and evolve.\n\nThis project shaped how I think about system design. It showed how much the quality of an interface depends on the clarity of the data behind it. It also gave me early experience working with middleware and structured content, tools that continue to influence how I think about scalable interfaces and AI-enabled systems.",
      },
    ],
  },
  {
    slug: "coca-cola-creative-technology",
    client: "Coca-Cola",
    projectName: "Coca-Cola",
    url: undefined,
    timeframe: "2023",
    heroSummary:
      "Anyone who has trained seriously knows dehydration does not hit all at once. It shows up as small changes: a little fatigue, a dip in focus, the sense that something is off even if you cannot name it. Most people rely on instinct to catch those moments, not instruments.\n\nCoca-Cola wanted to explore a vending concept that could help people before they reached that point. The idea was to read a simple hydration signal, interpret it responsibly, and recommend a product that matched the person's condition.\n\nMy role was to figure out how that experience could work in practice. I researched how hydration is measured, evaluated existing detection hardware, created simulated data based on the science, and shaped how the system should interpret that information. From there, I built a prototype flow that let the team see the idea as something real rather than theoretical.",
    roleSummary:
      "Creative Technologist / Applied AI Researcher",
    sections: [
      {
        id: "context",
        eyebrow: "Context",
        heading: "The idea was simple to describe but difficult to evaluate without building full hardware",
        body: "The idea was simple to describe but difficult to evaluate without building full hardware. Hydration sits at the intersection of fluid levels, electrolyte balance, activity, and environmental factors. Even when you simplify the problem, you still have questions about what a reading represents and how confidently you can act on it.\n\nWe also explored where the concept could go in the far future. One vision imagined a machine similar to a Coke Freestyle unit that could mix electrolytes, vitamins, and other nutrients based on what a person needed in the moment. This level of personalization is many years beyond what current technology can support, but it helped shape the creative direction and provided a clear north star for the experience.\n\nThe near-term challenge was more practical. The team needed a way to explore the concept today without custom sensors or production systems. We needed a model of dehydration that was grounded in real science but simple enough to use in a prototype. We also needed a clear interpretation layer: if the system read a hydration indicator, how should it decide what the user needed, and how should that recommendation be presented so it felt responsible and helpful?",
      },
      {
        id: "role",
        eyebrow: "What I Worked On",
        heading: "Research, modeling, and prototyping",
        body: "I began by researching how dehydration is classified and measured. Some methods are accurate but impractical outside clinical settings. Others are more feasible but noisy. I mapped out which signals could realistically be used in a consumer environment and identified hardware that could approximate them.\n\nSince we did not have real sensors, I created simulated hydration data based on the research. This included ranges for mild, moderate, and more significant dehydration, along with natural variation that reflected the noise you would expect in real-world readings. The goal was not precision. It was believability and a responsible interpretation of the science.\n\nWith the data model in place, I shaped the system's interpretation rules. This included how conservative the recommendations should be, how hydration states mapped to Coca-Cola's product line, and how the system should behave when the data was unclear or at the edge of two categories.\n\nOnce the logic felt stable, I built a prototype that showed how the experience might unfold. It allowed the team to interact with the idea, explore edge cases, and understand the pacing and tone of the recommendations.",
      },
      {
        id: "process",
        eyebrow: "How I Worked",
        heading: "Collaboration and rapid iteration",
        body: "I collaborated with designers, strategists, and creative directors to understand the intended experience. We discussed when the system should intervene, what information should be visible, and how the recommendation should be framed so the interaction supported people rather than diagnosing them.\n\nI presented the research in a way that was easy to understand, focusing on what mattered most for the concept. When new ideas surfaced, I updated the data model or interpretation rules and produced a new prototype. This helped the team evaluate decisions based on interaction rather than speculation.\n\nSince the work was exploratory, the prototype needed to evolve quickly. I designed it so we could adjust thresholds, product mappings, or interaction patterns without rebuilding the system. The aim was to keep the experience grounded and flexible at the same time.",
      },
      {
        id: "impact",
        eyebrow: "Outcomes",
        heading: "Concrete evaluation of an exploratory concept",
        body: "The project helped Coca-Cola understand what an AI-assisted hydration experience might look like and how it might function in a real environment. It revealed which ideas felt intuitive, which needed more clarity, and where hardware limitations would shape what was eventually possible.\n\nThe prototype gave leadership a concrete way to evaluate the concept. Instead of reacting to static mockups, they could click through a working flow and see how the system behaved at each step. This made it easier to determine which directions were promising and where further exploration was needed.",
      },
      {
        id: "reflections",
        eyebrow: "Reflections",
        heading: "Creating structure for exploration",
        body: "I enjoyed the mix of research, feasibility work, and prototyping. It required thinking across disciplines and shaping an experience that felt grounded even without real hardware. The project strengthened my ability to model system behavior and build prototypes that help teams make decisions when the path forward is not fully defined.\n\nThe work reminded me that early exploration is often about creating enough structure to make an idea feel real, then refining it as you learn more. That balance is where I do some of my best work.",
      },
    ],
  },
  {
    slug: "real-estate-platform",
    client: "Confidential Real Estate Client",
    projectName: "Real Estate Platform (Confidential)",
    url: undefined,
    timeframe: undefined,
    heroSummary:
      "Helped design and implement a modern real estate experience; details are anonymized due to client confidentiality. The work focused on creating flexible, user-friendly interfaces for property search, listings, and client interactions.",
    roleSummary:
      "Front-End Engineer / Technologist",
    sections: [
      {
        id: "overview",
        eyebrow: "Overview",
        heading: "Confidential work",
        body: "Helped design and implement a modern real estate experience; details are anonymized due to client confidentiality. The work focused on creating flexible, user-friendly interfaces for property search, listings, and client interactions. The project required careful attention to user experience while maintaining strict confidentiality standards.",
      },
      {
        id: "role",
        eyebrow: "Role & Scope",
        heading: "Discrete delivery",
        body: "Worked as a front-end engineer focused on building responsive, component-driven interfaces while respecting strict confidentiality requirements. The role involved translating design concepts into reliable components that could support complex property data and user workflows.",
      },
      {
        id: "process",
        eyebrow: "Process",
        heading: "Secure collaboration",
        body: "The project required careful coordination between design, engineering, and client teams while maintaining confidentiality. I focused on building modular components that could handle complex data structures and provide smooth user experiences across different device types.",
      },
      {
        id: "impact",
        eyebrow: "Impact",
        heading: "Modern foundation",
        body: "The work helped establish a modern foundation for the client's digital real estate experience. The component-driven approach made it easier to maintain and extend the platform while respecting confidentiality requirements. The project delivered improved usability and visual consistency.",
      },
    ],
  },
  {
    slug: "pfaff-designs",
    client: "Self-Initiated",
    projectName: "Pfaff.design",
    url: undefined,
    timeframe: "2024–2025",
    heroSummary:
      "Pfaff.design is a portfolio built to solve a familiar problem. The work I do sits between UX, engineering, and applied AI, but those layers are hard to show in a traditional format. This site pairs a clear narrative with an embedded agent that lets people explore the reasoning, structure, and technical detail beneath the surface.",
    roleSummary:
      "Design Engineer / Applied AI Technologist",
    sections: [
      {
        id: "context",
        eyebrow: "Context",
        heading: "A portfolio that needed to do more than show screens",
        body: "Every portfolio tells a story, but a lot of the real work happens underneath it.\n\nThe research, the choices, and the systems that hold everything together rarely fit inside a clean set of screenshots.\n\nI wanted to build a portfolio that did not hide that part of the work. Something where the surface stayed simple to read, and the structure underneath was still available for anyone who wanted to explore it.\n\nPfaff.design became the place to try that.",
      },
      {
        id: "idea",
        eyebrow: "Idea",
        heading: "Let the story stay simple, and let the structure stay accessible",
        body: "The idea for the site grew out of a simple question: how do you let people read the story while still giving them access to everything underneath it?\n\nI knew the portfolio needed to work for different kinds of readers. Some people want a quick overview. Others want the details. A few want the technical depth. I wanted the site to support all of those paths without turning into something confusing or slow.\n\nThat is why the foundation is a static site. It keeps the experience fast and familiar, and it lets the case studies stay focused on clear narrative. On top of that, the site includes an embedded agent that can answer questions, surface extra context, and reveal the deeper structure when someone wants it.\n\nIt created a balance I had not seen in a traditional portfolio. You can skim the work like any normal site, or you can treat it like a conversation and follow the threads that matter to you.",
      },
      {
        id: "process",
        eyebrow: "Process",
        heading: "Exploring the limits of generative UI, then choosing clarity",
        body: "I started with planning, research, and a long list of questions about how a generative front end should behave. I explored a version of the site that was fully generative. Every answer came from the model, and every layout was created on the fly. The prototype worked, but it also revealed a problem. Generative interfaces are interesting when people want to spend time with them, but a portfolio needs to get information across quickly.\n\nThat is what pushed the project in a different direction. I shifted to a static site that holds the primary narrative and built a structured system underneath it. The content lives in a knowledge base written in YAML and JSON, which are simple text-based formats for organizing information. They let me define the important pieces of each project in a way that is easy for both humans and the agent to understand.\n\nOnce that content layer was in place, I added intent routing, schemas, and a small orchestration layer. The agent can figure out when to give a quick answer, when to generate a structured layout, or when to offer a deeper dive. It also knows what it should not invent.\n\nMost of the work in this phase happened quietly in the background. Designing schemas, testing prompts, rewriting pathways, and building guardrails so the system stayed predictable. The goal was not to automate the site. The goal was to create something that felt steady and conversational at the same time.",
      },
      {
        id: "outcomes",
        eyebrow: "Outcomes",
        heading: "A portfolio that reflects how I think",
        body: "The finished site does two things at once. It tells a clear story about the work, and it also gives people a way to explore the structure behind it. Most portfolios flatten that distinction. This one makes space for both.\n\nThe static pages give readers the overview they expect, and the embedded agent lets them go deeper when they want to understand how something was built, why certain decisions were made, or what tools and processes shaped the project. That mix feels closer to how I work in real life.\n\nThe build taught me a lot about working with AI in a controlled way. The constraints, the schemas, and the routing logic matter as much as the model itself. The most interesting parts of the project were not the flashy features, but the small structural choices that made the system predictable and easy to reason about.\n\nIn the end, Pfaff.design became more than a portfolio. It became a place to test ideas about clarity, interaction, and AI-assisted systems. It reflects how I think, how I solve problems, and how I like to work with technology. And it leaves room for future versions of the site to become even more adaptive.",
      },
    ],
  },
];

/**
 * Get a case study by slug
 */
export function getCaseStudyBySlug(slug: string): CaseStudyPage | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

