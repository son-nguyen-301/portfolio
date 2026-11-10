// Read the content collections (see content.config.ts and docs/content-model.md).
// Pages and components read content only through these.

export function useProfile() {
  return useAsyncData('content:profile', () => queryCollection('profile').first())
}

export function useServices() {
  return useAsyncData('content:services', () => queryCollection('services').first())
}

export function useTimeline() {
  return useAsyncData('content:timeline', () => queryCollection('timeline').first())
}

export function useSkills() {
  return useAsyncData('content:skills', () => queryCollection('skills').first())
}

export function useEarlier() {
  return useAsyncData('content:earlier', () => queryCollection('earlier').first())
}

// All case studies, in their `order`.
export function useCaseStudies() {
  return useAsyncData('content:work', () => queryCollection('work').order('order', 'ASC').all())
}

// One case study by its page path, for example "/work/aspire-redesign".
export function useCaseStudy(path: string) {
  return useAsyncData(`content:work:${path}`, () => queryCollection('work').path(path).first())
}

// All Lab projects, in their `order`.
export function useLabProjects() {
  return useAsyncData('content:lab', () => queryCollection('lab').order('order', 'ASC').all())
}
