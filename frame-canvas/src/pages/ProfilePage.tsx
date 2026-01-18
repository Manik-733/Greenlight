import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  MapPin,
  Globe,
  ExternalLink,
  Film,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiClient } from "@/lib/api-client";
import { useAuth } from "@/auth/useAuth";
import { formatDate } from "@/lib/format";

interface ProfileData {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  verified_credits_count: number;
  projects_count: number;
}

interface PendingCredit {
  id: string;
  project_id: string;
  project_title: string;
  job_title: string;
  character_name: string | null;
  status: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const api = useApiClient();
  const { user: currentUser } = useAuth();
  const [pendingCredits, setPendingCredits] = useState<PendingCredit[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    data: profile,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.get<ProfileData>(`/profiles/${username}`),
    enabled: !!username,
  });

  // Fetch pending credits only for current user viewing their own profile
  const isOwnProfile = currentUser?.username === profile?.username;

  const { data: pendingCreditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ["pending-credits", profile?.user_id],
    queryFn: async () => {
      const response = await api.get<{ credits: PendingCredit[] }>(
        `/credits/pending`
      );
      return response.credits || [];
    },
    enabled: !!isOwnProfile && !!profile?.user_id,
  });

  if (pendingCreditsData && pendingCreditsData.length > 0) {
    setPendingCredits(pendingCreditsData);
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !profile) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              User Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error
                ? error.message
                : "We couldn't find the user you're looking for."}
            </p>
            <Link to="/discover">
              <Button variant="gold">Back to Discover</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Profile Header */}
      <section className="py-16 lg:py-24 border-b border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-start gap-8"
            >
              {/* Avatar */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-secondary shrink-0 border-2 border-border">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || "User avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-4xl text-muted-foreground">
                      {(profile.display_name || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {profile.display_name || "User"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  @{profile.username || "user"}
                </p>

                {profile.bio ? (
                  <p className="mt-4 text-foreground/90 leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="mt-4 text-muted-foreground/60 italic">
                    No bio yet
                  </p>
                )}

                {/* Stats */}
                <div className="mt-6 flex gap-6 text-sm">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {profile.verified_credits_count}
                    </p>
                    <p className="text-muted-foreground">
                      {profile.verified_credits_count === 1
                        ? "Credit"
                        : "Credits"}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {profile.projects_count}
                    </p>
                    <p className="text-muted-foreground">
                      {profile.projects_count === 1 ? "Project" : "Projects"}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  Member since {formatDate(profile.created_at)}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pending Credits Section - Only for own profile */}
      {isOwnProfile && pendingCredits.length > 0 && (
        <section className="py-12 lg:py-16 border-b border-border">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-8">
                Pending Credits ({pendingCredits.length})
              </h2>

              <div className="space-y-4">
                {pendingCredits.map((credit) => (
                  <motion.div
                    key={credit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-card border border-border rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          to={`/p/${credit.project_id}`}
                          className="text-lg font-semibold text-primary hover:underline"
                        >
                          {credit.project_title}
                        </Link>
                        <p className="text-sm text-foreground mt-1">
                          {credit.job_title}
                          {credit.character_name &&
                            ` • ${credit.character_name}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={async () => {
                            setActionLoading(credit.id);
                            try {
                              await api.patch(
                                `${
                                  import.meta.env.VITE_API_URL
                                }/api/bmdb/credits/${credit.id}`,
                                { status: "VERIFIED" }
                              );
                              setPendingCredits(
                                pendingCredits.filter((c) => c.id !== credit.id)
                              );
                            } catch (err) {
                              console.error("Error verifying credit:", err);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === credit.id}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Verify
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            setActionLoading(credit.id);
                            try {
                              await api.patch(
                                `${
                                  import.meta.env.VITE_API_URL
                                }/api/bmdb/credits/${credit.id}`,
                                { status: "REJECTED" }
                              );
                              setPendingCredits(
                                pendingCredits.filter((c) => c.id !== credit.id)
                              );
                            } catch (err) {
                              console.error("Error rejecting credit:", err);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === credit.id}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filmography Placeholder */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Film className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Filmography
              </h2>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Filmography coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
