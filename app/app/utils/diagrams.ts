// The diagram components that a case study's or a Lab project's media can
// name in `src`, for example "DiagramAiPipeline" (docs/content-model.md). Each
// one is an inline SVG that takes the media's `alt` text as its `title`. A name
// that is not here shows a neutral placeholder.
import type { Component } from 'vue'
import DiagramAiPipeline from '../components/DiagramAiPipeline.vue'
import DiagramCmsPages from '../components/DiagramCmsPages.vue'
import DiagramFeatureFlag from '../components/DiagramFeatureFlag.vue'
import DiagramMultiCurrency from '../components/DiagramMultiCurrency.vue'
import DiagramRoomsByUrl from '../components/DiagramRoomsByUrl.vue'
import DiagramTaskRunner from '../components/DiagramTaskRunner.vue'

export const diagrams: Partial<Record<string, Component>> = {
  DiagramAiPipeline,
  DiagramCmsPages,
  DiagramFeatureFlag,
  DiagramMultiCurrency,
  DiagramRoomsByUrl,
  DiagramTaskRunner,
}
