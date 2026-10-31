export type StudentProject = { id: string; title: string; url: string; status: 'waiting' | 'confirmed' | 'not_confirmed' };

export type StudentProgress = {
  attended: number;
  days_open: number;
  checked_in_today: boolean;
  linkedin_url: string | null;
  linkedin_missed: number;
  projects: StudentProject[];
  social: { platform: string; month: string; followers: number }[];
};

export const SOCIAL_PLATFORMS = ['LinkedIn', 'Facebook', 'Instagram', 'X'];

export const PROJECT_STATUS: Record<StudentProject['status'], { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  waiting: { label: 'Waiting for your instructor', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  not_confirmed: { label: 'Not confirmed', tone: 'danger' },
};

export const confirmedProjects = (p: StudentProgress) => p.projects.filter((x) => x.status === 'confirmed').length;

/** Newest number for each platform, and the change since last month when there is one. */
export function socialSummary(p: StudentProgress) {
  return SOCIAL_PLATFORMS.flatMap((platform) => {
    const [latest, previous] = p.social.filter((s) => s.platform === platform);
    if (!latest) return [];
    return [{ platform, followers: latest.followers, change: previous ? latest.followers - previous.followers : null }];
  });
}
