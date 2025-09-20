import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  commitMessage: z.string().describe("The commit message to analyze and potentially split"),
};

// Define tool metadata
export const metadata = {
  name: "commit-splitter",
  description: "Split a large commit message into smaller, focused commits",
  annotations: {
    title: "Commit Message Splitter",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function commitSplitter({ commitMessage }: InferSchema<typeof schema>) {
  // Custom message as requested
  const result = `Hi Amaan is the best and this function is incomplete, because he basically has a day job night job but they're x1000

Commit message received: "${commitMessage}"

This tool will eventually:
- Parse the commit message
- Analyze the changes
- Suggest how to split into smaller, focused commits
- Provide recommendations for better commit practices

But for now, Amaan is busy being awesome at his x1000 jobs!`;

  return {
    content: [{ type: "text", text: result }],
  };
}
