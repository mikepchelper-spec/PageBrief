export const SUMMARIZE_SYSTEM = `You are PageBrief, a research assistant. You produce structured briefs of web pages for users doing competitive research, market analysis, and information gathering.

You ALWAYS respond with valid JSON. Never include prose outside JSON. Never wrap the JSON in markdown code fences.`;

export function summarizePrompt(input: {
  title: string;
  url: string;
  content: string;
}): string {
  const truncated = input.content.slice(0, 12000);
  return `Produce a structured brief of the following web page.

Output JSON shape:
{
  "tldr": ["bullet 1", "bullet 2", "bullet 3"],
  "entities": [
    {"key": "product_name", "value": "..."},
    {"key": "pricing", "value": "..."},
    {"key": "target_audience", "value": "..."}
  ]
}

Rules:
- Exactly 3 TL;DR bullets. Each <= 20 words. Concrete, no fluff, no marketing language.
- Entities: 3-8 items. Use snake_case keys. Common keys: product_name, company, pricing, target_audience, key_features, differentiators, integrations, tech_stack, claims, key_metric. Add others if relevant.
- If a value is unknown or absent, do not include that entity (don't write "unknown" or "N/A").
- Be objective. Quote specific numbers and names when present.

Page title: ${input.title}
Page URL: ${input.url}
Page content:
"""
${truncated}
"""`;
}

export const DERIVE_SCHEMA_SYSTEM = `You are PageBrief. You derive comparison table schemas for groups of related web research briefs.

You ALWAYS respond with valid JSON. Never include prose outside JSON. Never wrap the JSON in markdown code fences.`;

export function deriveSchemaPrompt(briefsJson: string): string {
  return `Given these research briefs, derive a comparison schema (the most useful columns to compare these items side-by-side).

Output JSON shape:
{
  "columns": [
    {"key": "snake_case_key", "label": "Display Label", "type": "text|number|currency|list"}
  ]
}

Rules:
- 3 to 7 columns.
- Choose the most DISCRIMINATING attributes (where values likely differ between briefs).
- Avoid columns where most briefs would say the same thing.
- Always use snake_case keys.
- Types: "text" for prose-ish, "number" for plain numbers, "currency" for money, "list" for comma-separated lists.
- Avoid free-form prose columns (no "description", "summary", "details").

Briefs:
${briefsJson}`;
}

export const FILL_ROW_SYSTEM = `You are PageBrief. You extract structured values from a single research brief against a comparison schema.

You ALWAYS respond with valid JSON. Never include prose outside JSON. Never wrap the JSON in markdown code fences.`;

export function fillRowPrompt(input: {
  schemaJson: string;
  briefJson: string;
}): string {
  return `Given a comparison schema and a single brief, extract a value for each column.

Output JSON shape:
{
  "cells": {
    "column_key_1": "value",
    "column_key_2": "value"
  }
}

Rules:
- Include every column from the schema, even if value unknown (use "—" for unknown).
- Keep values short and scan-friendly: max 80 chars per cell.
- For "list" type columns, comma-separate items.
- For "currency" type, include currency symbol and unit if relevant (e.g., "$19/mo", "€500 one-time").
- Do not invent facts. If absent from the brief, output "—".

Schema:
${input.schemaJson}

Brief:
${input.briefJson}`;
}
