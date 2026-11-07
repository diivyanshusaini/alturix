export type Section = 'video' | 'graphic' | 'experiment';
export type Contribution = 'individual' | 'collaborative' | 'client' | 'speculative';
export type Status = 'draft' | 'review' | 'published' | 'unpublished';
export interface Asset {
  id: number;
  original_name: string;
  stored_name: string;
  mime: string;
  kind: 'video' | 'image' | 'pdf';
  size: number;
  folder_id: number | null;
  title: string;
  description: string;
  category: string;
  poster_asset_id: number | null;
  url: string;
  poster_url: string | null;
  used_in?: number;
  role?: 'gallery' | 'final' | 'alt';
  caption?: string;
  created_at: string;
}
export interface CaseStudy {
  brief?: string;
  objective?: string;
  direction?: string;
  research?: string;
  concept?: string;
  typography?: string;
  execution?: string;
  output?: string;
  contribution?: string;
}
export interface Project {
  id: number;
  slug: string;
  title: string;
  section: Section;
  category: string;
  project_type: string;
  contribution: Contribution;
  status: Status;
  featured: boolean;
  sort_order: number;
  cover: Asset | null;
  cover_asset_id: number | null;
  summary: string;
  case_study: CaseStudy;
  tools: string[];
  credits: string;
  year: string;
  assets: Asset[];
  updated_at: string;
}
export interface HeroStat {
  value: string;
  label: string;
}
export interface EcosystemTool {
  code: string;
  name: string;
  sub: string;
}
export interface ReelTrack {
  code: string;
  name: string;
  fps: string;
  dur: string;
  tag: string;
}
export interface ProcessStep {
  num: string;
  title: string;
  desc: string;
}
export interface JourneyItem {
  period: string;
  role: string;
  org: string;
  desc: string;
}
export interface Settings {
  hero_wordmark?: string;
  hero_badge?: string;
  hero_title: string;
  hero_intro: string;
  hero_location?: string;
  hero_portrait_url?: string;
  hero_ethos_quote?: string;
  hero_stats?: HeroStat[];
  marquee_words?: string[];
  work_heading_1?: string;
  work_heading_2?: string;
  ecosystem_title?: string;
  ecosystem_tools?: EcosystemTool[];
  raw_heading_1?: string;
  raw_heading_2?: string;
  raw_description?: string;
  raw_before_image?: string;
  raw_after_image?: string;
  reel_heading_1?: string;
  reel_heading_2?: string;
  reel_tracks?: ReelTrack[];
  behind_heading_1?: string;
  behind_heading_2?: string;
  behind_intro?: string;
  capabilities: string[];
  process_steps?: ProcessStep[];
  director_quote?: string;
  director_name?: string;
  director_sub?: string;
  journey_heading_1?: string;
  journey_heading_2?: string;
  journey_items?: JourneyItem[];
  milestones_heading_1?: string;
  milestones_heading_2?: string;
  milestones_desc?: string;
  cta_heading_1?: string;
  cta_heading_2?: string;
  cta_intro?: string;
  cta_card_title_1?: string;
  cta_card_title_2?: string;
  cta_card_sub?: string;
  location_text?: string;
  about: string;
  instagram: string;
  email: string;
}
export interface Folder {
  id: number;
  name: string;
}
export interface Message {
  id: number;
  name: string;
  email: string;
  body: string;
  is_read: number;
  created_at: string;
}
export const CONTRIB_LABEL: Record<Contribution, string> = {
  individual: 'Individual work',
  collaborative: 'Collaboration',
  client: 'Client work',
  speculative: 'Speculative concept',
};
