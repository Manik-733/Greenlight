import { CreditStatus, ProjectType } from '@/types/bmdb';

export const formatProjectType = (type: ProjectType): string => {
  const labels: Record<ProjectType, string> = {
    SHORT_FILM: 'Short Film',
    FEATURE: 'Feature',
    DOCUMENTARY: 'Documentary',
    MUSIC_VIDEO: 'Music Video',
    COMMERCIAL: 'Commercial',
    WEB_SERIES: 'Web Series',
    STUDENT_FILM: 'Student Film',
    EXPERIMENTAL: 'Experimental',
  };
  return labels[type];
};

export const formatRuntime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const getCreditStatusColor = (status: CreditStatus): string => {
  const colors: Record<CreditStatus, string> = {
    VERIFIED: 'bg-status-verified/20 text-status-verified border-status-verified/30',
    PENDING_ACCEPTANCE: 'bg-status-pending/20 text-status-pending border-status-pending/30',
    UNCLAIMED: 'bg-status-unclaimed/20 text-status-unclaimed border-status-unclaimed/30',
    REJECTED: 'bg-status-rejected/20 text-status-rejected border-status-rejected/30',
    DISPUTED: 'bg-status-disputed/20 text-status-disputed border-status-disputed/30',
    REMOVED: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[status];
};

export const getCreditStatusLabel = (status: CreditStatus): string => {
  const labels: Record<CreditStatus, string> = {
    VERIFIED: 'Verified',
    PENDING_ACCEPTANCE: 'Pending',
    UNCLAIMED: 'Unclaimed',
    REJECTED: 'Rejected',
    DISPUTED: 'Disputed',
    REMOVED: 'Removed',
  };
  return labels[status];
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(dateString);
};
