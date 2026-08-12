// The frontend's types now live in the shared workspace package, so the
// backend and frontend describe the wire data with the exact same definitions.
// This file just re-exports them, so existing `import { ... } from "../types"`
// lines keep working. Add new shared shapes in ../../shared/src, not here.
export * from "frc-commentary-shared";
