// The diagram components that a case study's media can name in `src`, for
// example "DiagramAiPipeline" (docs/content-model.md). PF-014 (#40) builds them
// and adds them here. A name that is not here shows a neutral placeholder.
import type { Component } from 'vue'

export const diagrams: Partial<Record<string, Component>> = {}
