// The contract shared between the backend and the frontend. Every type that
// crosses the wire is defined once here (as a Zod schema, so we get both the
// TypeScript type and a runtime validator from one definition) and imported by
// both sides. Add a new shared shape by adding it in one of these modules.
export * from "./settings.js";
export * from "./tba.js";
export * from "./vmix.js";
export * from "./alerts.js";
