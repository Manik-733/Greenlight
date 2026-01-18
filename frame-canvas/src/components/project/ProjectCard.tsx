import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Project } from '@/types/bmdb';
import { formatProjectType, formatRating } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  index?: number;
  variant?: 'default' | 'featured' | 'compact';
}

export function ProjectCard({ project, index = 0, variant = 'default' }: ProjectCardProps) {
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/p/${project.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-card border border-border/50 transition-all duration-300",
            "hover:border-primary/30 hover:shadow-elevated",
            isFeatured && "md:flex md:gap-6"
          )}
        >
          {/* Poster */}
          <div
            className={cn(
              "relative overflow-hidden bg-muted",
              isCompact ? "aspect-[16/9]" : "aspect-[2/3]",
              isFeatured && "md:w-48 md:shrink-0 md:aspect-[2/3]"
            )}
          >
            {project.posterUrl ? (
              <img
                src={project.posterUrl}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-display text-2xl text-muted-foreground">
                  {project.title.charAt(0)}
                </span>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            
            {/* Rating badge */}
            {project.averageRating && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
                <Star className="h-3 w-3 text-primary fill-primary" />
                <span className="text-xs font-medium text-foreground">
                  {formatRating(project.averageRating)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={cn("p-4", isFeatured && "md:py-6 md:pr-6 md:flex-1")}>
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="genre" className="text-[10px]">
                {formatProjectType(project.projectType)}
              </Badge>
              {project.year && (
                <span className="text-xs text-muted-foreground">{project.year}</span>
              )}
            </div>
            
            <h3 className={cn(
              "font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2",
              isFeatured ? "text-xl lg:text-2xl" : "text-lg"
            )}>
              {project.title}
            </h3>
            
            {project.tagline && !isCompact && (
              <p className="mt-2 text-sm text-muted-foreground italic line-clamp-2">
                "{project.tagline}"
              </p>
            )}

            {isFeatured && project.synopsis && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                {project.synopsis}
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              {project.organization && (
                <span className="line-clamp-1">{project.organization}</span>
              )}
              {project.ratingCount && project.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {project.ratingCount} ratings
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
