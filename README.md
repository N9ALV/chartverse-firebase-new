
# ChartVerse: AI-Powered Chart Generation (Next.js & Genkit)

This application currently serves as an AI-powered tool for generating Chart.js visualizations. Users provide a description and data, and the AI suggests an appropriate Chart.js chart type and configuration.

## Instructions for Creating a Mermaid-ONLY Duplicate

This README provides guidance for duplicating this project and repurposing it into a **Mermaid-ONLY** diagram generation tool. The goal is to leverage the existing Next.js and Genkit setup but pivot the AI functionality entirely to Mermaid diagrams.

**DO NOT attempt a combined Chart.js and Mermaid app using a single AI flow with a "decision" field, as this proved problematic with AI output consistency and schema complexity for the LLM.**

### 1. Duplicate the Project

1.  Copy the entire project directory to a new location.
2.  Initialize a new Git repository if needed.
3.  Install dependencies: `npm install` (or `yarn install`).

### 2. Core Task: Repurpose for Mermaid Diagrams

The primary goal is to modify the application so that users can describe a diagram, and the AI generates the corresponding Mermaid syntax for rendering.

### 3. Key Files & Areas for Modification:

**A. AI Type Definitions (`src/ai/types.ts`)**

*   **Current:** Defines schemas for Chart.js input/output.
*   **Mermaid-ONLY Task:**
    *   Define a new Zod schema for the AI input, e.g., `SuggestMermaidDefinitionInputSchema = z.object({ description: z.string() });`.
    *   Define a new Zod schema for the AI's direct output, e.g., `AIPromptMermaidOutputSchema = z.object({ mermaidDefinition: z.string().min(1), reasoning: z.string().min(1) });`. This should be kept simple to ensure AI compliance.
    *   The final flow output schema can be the same as `AIPromptMermaidOutputSchema`.
    *   Remove all Chart.js related schemas and types.

**B. AI Flow Logic (e.g., rename `src/ai/flows/suggest-chart-configuration.ts` to `src/ai/flows/suggest-mermaid-definition.ts`)**

*   **Current:** Contains the Genkit flow and prompt for Chart.js.
*   **Mermaid-ONLY Task:**
    *   Update the file to use the new Mermaid-specific Zod schemas from `src/ai/types.ts`.
    *   **Crucially, rewrite the AI prompt.** The prompt should instruct the AI (e.g., Gemini) to:
        *   Act as an expert in Mermaid diagram syntax.
        *   Take a user's textual description.
        *   Generate a valid Mermaid diagram definition string.
        *   Provide a brief reasoning for the chosen diagram structure.
        *   Output a JSON object conforming to `AIPromptMermaidOutputSchema`.
    *   The flow function (e.g., `suggestMermaidDefinition`) will take the `SuggestMermaidDefinitionInput` and return the `AIPromptMermaidOutput`.
    *   Include server-side validation to ensure `mermaidDefinition` is present and non-empty in the AI's response.

**C. Page Logic (`src/app/page.tsx`)**

*   **Current:** Manages Chart.js state, renders `ChartRenderer`, and handles AI suggestions for charts.
*   **Mermaid-ONLY Task:**
    *   Remove all state related to `chartConfig`, `chartRef`, etc.
    *   Add state for `mermaidDefinition: string | null` and `aiReasoning: string | null`.
    *   Replace the `ChartRenderer` component with a new `MermaidRenderer` component (see below).
    *   Update the `getAISuggestion` call (or create a new one via `src/lib/actions.ts`) to interact with the new Mermaid AI flow. The input will be the user's description, and the output will be the Mermaid definition and reasoning.
    *   Adjust URL parameter handling to manage `mermaidDefinition` and `aiPrompt` (for the description).

**D. Rendering Component (replace `src/components/ChartRenderer.tsx` with `src/components/MermaidRenderer.tsx`)**

*   **Current:** `ChartRenderer.tsx` handles Chart.js rendering.
*   **Mermaid-ONLY Task:**
    *   Create `src/components/MermaidRenderer.tsx`.
    *   This component will take `mermaidDefinition: string` as a prop.
    *   It will use the `mermaid` library to render the diagram.
    *   **Rendering Tip:** Mermaid initialization (`mermaid.initialize({...})`) and rendering (`mermaid.render(...)` or updating an existing element) often need to happen client-side within a `useEffect` hook. Be mindful of how Mermaid interacts with the DOM in a React/Next.js environment. You might render to a specific `div` and update its `innerHTML`.
    *   Example structure:
        ```tsx
        'use client';
        import mermaid from 'mermaid';
        import React, { useEffect, useRef } from 'react';

        interface MermaidRendererProps {
          definition: string;
          // Potentially an ID for the graph div
        }

        export function MermaidRenderer({ definition }: MermaidRendererProps) {
          const mermaidRef = useRef<HTMLDivElement>(null);

          useEffect(() => {
            mermaid.initialize({ startOnLoad: false, theme: 'neutral' /* or your preferred theme */ });
          }, []);

          useEffect(() => {
            if (mermaidRef.current && definition) {
              try {
                // Use a unique ID for each render if necessary or manage updates carefully
                const graphId = 'mermaid-graph-' + Date.now(); 
                mermaid.render(graphId, definition, (svgCode) => {
                  if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = svgCode;
                  }
                });
              } catch (e) {
                console.error("Mermaid rendering error:", e);
                if (mermaidRef.current) {
                  mermaidRef.current.innerHTML = 'Error rendering diagram.';
                }
              }
            } else if (mermaidRef.current) {
              mermaidRef.current.innerHTML = ''; // Clear if no definition
            }
          }, [definition]);

          return <div ref={mermaidRef} className="w-full h-full bg-card p-4 rounded-lg shadow-md"></div>;
        }
        ```

**E. Server Actions (`src/lib/actions.ts`)**

*   **Current:** Calls the Chart.js AI flow.
*   **Mermaid-ONLY Task:**
    *   Update the server action (e.g., rename `getAISuggestion` or create `getMermaidSuggestion`) to call your new Mermaid AI flow (e.g., `suggestMermaidDefinition`).
    *   Ensure it passes the correct input type and expects the correct output type from `src/ai/types.ts`.

### 4. Dependencies

*   Add the `mermaid` library: `npm install mermaid`

### 5. Avoiding Previous Pitfalls (Lessons Learned)

*   **AI Output Schema Simplicity:**
    *   **Problem:** When we attempted a combined Chart.js/Mermaid app using a Zod `discriminatedUnion` for the AI output schema, the Gemini model had issues with the `const` keyword in the JSON schema generated by Genkit. This led to API errors.
    *   **Solution for Mermaid-ONLY:** Keep the `AIPromptMermaidOutputSchema` (the schema you define in `ai.definePrompt({ output: { schema: ... } })`) very simple and flat (e.g., just `mermaidDefinition` and `reasoning` as required strings). This avoids complex JSON schema features that the LLM might struggle with.

*   **AI Output Consistency:**
    *   **Problem:** The AI occasionally failed to provide all required fields (e.g., `chartJsConfiguration` was empty even if `decision` was `chartjs`).
    *   **Solution for Mermaid-ONLY:**
        *   Use very clear and direct instructions in your AI prompt.
        *   Implement robust server-side validation in your Genkit flow to check that the AI's response (e.g., `mermaidDefinition`) is not empty or `null` before returning it to the client. If it's invalid, throw an error.

*   **`'use server'` Directive and Exports:**
    *   **Reminder:** Files marked with `'use server';` (like your AI flow and server actions) can ONLY export async functions.
    *   **Solution:** Keep all Zod schema definitions and TypeScript type aliases in separate files (like `src/ai/types.ts`) that do *not* have the `'use server';` directive. Import them where needed.

*   **Styling and Theming:**
    *   Mermaid diagrams can be themed. Consider how to integrate this with the existing application's theme (`globals.css`) or if Mermaid's built-in themes are sufficient. The `MermaidRenderer` example above uses `theme: 'neutral'`.

### 6. Testing

*   Thoroughly test the AI's ability to generate various types of Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, etc.) from different descriptions.
*   Verify error handling for invalid AI responses or rendering issues.

By following these guidelines, the next agent should be able to successfully create a Mermaid-only version of this application while being mindful of the challenges encountered previously. Good luck!
