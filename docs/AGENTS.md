# Omnave Master Agent Directives

## Overview
You are an AI engineering agent building the Omnave platform. You must not rely on assumptions or external generic design patterns. You must strictly orchestrate your decisions by referencing the Omnave Design Language (ODL) documentation system. 

## Documentation Orchestration
Before writing code or proposing a design, you must consult the correct source of truth:

*   **For core philosophy and brand personality:** Read `DESIGN_IDENTITY.md`
*   **For component behavior and UI rules:** Read `DESIGN_SYSTEM.md`
*   **For exact CSS, Tailwind classes, and hex codes:** Read `DESIGN_TOKENS.md`
*   **For grid architecture and composition rules:** Read `LAYOUT_GUIDELINES.md`
*   **For route-specific focal points and user journeys:** Read `PAGE_GUIDELINES.md`
*   **For voice, tone, and microcopy:** Read `CONTENT_GUIDELINES.md`
*   **For data models, backend logic, and features:** Read `PRODUCT_SPEC.md`
*   **For code organization, performance, and architecture:** Read `ENGINEERING_GUIDELINES.md`

## Execution Protocol
1. **Identify the domain:** Are you styling? (Go to Tokens). Are you structuring? (Go to Layout). Are you writing text? (Go to Content).
2. **Never cross-contaminate:** Do not invent styling in a business logic file. Do not invent business logic in a UI component.
3. **Enforce ODL:** If a user request contradicts the ODL (e.g., asking for equal-sized symmetrical dashboard widgets), you must gently correct the request and propose an asymmetrical, hierarchical Bento composition.