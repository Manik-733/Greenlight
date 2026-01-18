import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Edit, CheckCircle2, Gift } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@/auth/useAuth";

interface Credit {
  id: string;
  name?: string;
  character_name?: string | null;
  is_verified: boolean;
  status?: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  project_type: string;
  poster_url: string | null;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    username: string;
    display_name: string;
  };
  credits: Record<string, Credit[]>;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  SHORT: "Short Film",
  FEATURE: "Feature Film",
  DOCUMENTARY: "Documentary",
  WEB_SERIES: "Web Series",
  SCENE: "Scene/Clip",
  OTHER: "Other",
};

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const { user } = useAuth();
  const [claimingCredits, setClaimingCredits] = useState<Set<string>>(
    new Set()
  );
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});

  // Fetch project by slug
  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const response = await apiClient.get<Project>(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects/slug/${slug}`
      );
      return response;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="py-12 lg:py-16">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !project) {
    return (
      <Layout>
        <div className="py-12 lg:py-16">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
                <h2 className="font-semibold mb-2">Project Not Found</h2>
                <p className="mb-4">
                  We couldn't find the project you're looking for.
                </p>
                <Button variant="outline" onClick={() => navigate("/discover")}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to Discover
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner =
    user?.id &&
    project.owner &&
    // Check if user is owner (would need owner_id in response ideally, but we can check username match)
    user.username === project.owner.username;

  const handleClaimCredit = async (creditId: string) => {
    if (!user) return;

    setClaimingCredits((prev) => new Set(prev).add(creditId));
    setClaimErrors((prev) => ({ ...prev, [creditId]: "" }));

    try {
      await apiClient.post(
        `${import.meta.env.VITE_API_URL}/api/bmdb/credits/${creditId}/claim`,
        {}
      );
      // Remove the credit from display after successful claim
      // Refetch the project to show updated state
      // For now, just remove it from the claiming set
      setClaimingCredits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(creditId);
        return newSet;
      });
      // Optionally refetch project data
      // window.location.reload();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to claim credit";
      setClaimErrors((prev) => ({ ...prev, [creditId]: errorMsg }));
      setClaimingCredits((prev) => {
        const newSet = new Set(prev);
        newSet.delete(creditId);
        return newSet;
      });
    }
  };

  const creditsGrouped = Object.entries(project.credits || {});

  return (
    <Layout>
      <div className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate("/discover")}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {isOwner && (
                <Button
                  variant="gold"
                  onClick={() => navigate(`/p/${project.slug}/edit`)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Project
                </Button>
              )}
            </div>

            {/* Poster & Title Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
              {/* Poster */}
              {project.poster_url && (
                <div className="lg:col-span-1">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg border border-border">
                    <img
                      src={project.poster_url}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Title & Meta */}
              <div
                className={
                  project.poster_url ? "lg:col-span-3" : "lg:col-span-4"
                }
              >
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline">
                    {PROJECT_TYPE_LABELS[project.project_type] ||
                      project.project_type}
                  </Badge>
                  {project.status === "PUBLISHED" && (
                    <Badge variant="secondary">Published</Badge>
                  )}
                </div>

                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  {project.title}
                </h1>

                {project.description && (
                  <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                    {project.description}
                  </p>
                )}

                {/* Owner */}
                <div className="mt-8 p-4 bg-card rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Created by
                  </p>
                  <Link
                    to={`/u/${project.owner.username}`}
                    className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {project.owner.display_name}
                  </Link>
                </div>
              </div>
            </div>

            {/* Credits Section */}
            {creditsGrouped.length > 0 && (
              <div className="mt-12">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
                  Credits
                </h2>

                <div className="space-y-8">
                  {creditsGrouped.map(([jobTitle, credits]) => (
                    <div key={jobTitle}>
                      <h3 className="font-semibold text-foreground mb-4 capitalize">
                        {jobTitle}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {credits.map((credit) => (
                          <div
                            key={credit.id}
                            className="p-4 bg-card rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">
                                  {credit.name || "—"}
                                </p>
                                {credit.is_verified && (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                              {credit.character_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {credit.character_name}
                                </p>
                              )}
                              {claimErrors[credit.id] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {claimErrors[credit.id]}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {credit.is_verified && (
                                <Badge variant="default" className="shrink-0">
                                  Verified
                                </Badge>
                              )}
                              {user &&
                                !credit.is_verified &&
                                credit.status === "UNCLAIMED" &&
                                credit.name &&
                                credit.name.toLowerCase() ===
                                  user.display_name?.toLowerCase() && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleClaimCredit(credit.id)}
                                    disabled={claimingCredits.has(credit.id)}
                                    className="shrink-0 gap-1"
                                  >
                                    <Gift className="h-4 w-4" />
                                    Claim
                                  </Button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {creditsGrouped.length === 0 && (
              <div className="mt-12 p-8 bg-card rounded-lg border border-border text-center">
                <p className="text-muted-foreground">
                  No verified credits added yet.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
