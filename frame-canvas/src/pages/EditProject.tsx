import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { useApiClient } from "@/lib/api-client";

const PROJECT_TYPES = [
  { value: "SHORT", label: "Short Film" },
  { value: "FEATURE", label: "Feature Film" },
  { value: "DOCUMENTARY", label: "Documentary" },
  { value: "WEB_SERIES", label: "Web Series" },
  { value: "SCENE", label: "Scene/Clip" },
  { value: "OTHER", label: "Other" },
];

interface Credit {
  id: string;
  credit_type: string;
  job_title: string;
  character_name: string | null;
  credited_name: string | null;
  credited_user_id: string | null;
  status: string;
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
  credits?: Credit[];
}

export default function EditProject() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectType: "SHORT",
    posterUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditFormData, setCreditFormData] = useState({
    credit_type: "CAST",
    job_title: "",
    character_name: "",
    useExistingUser: false,
    searchQuery: "",
    credited_user_id: "",
    credited_name: "",
  });
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ user_id: string; username: string; display_name: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch project by slug (public endpoint for project info only)
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
      setFormData({
        title: response.title,
        description: response.description || "",
        projectType: response.project_type,
        posterUrl: response.poster_url || "",
      });
      // Note: credits are fetched separately using the owner endpoint
      return response;
    },
    enabled: !!slug,
  });

  // Fetch all credits (owner view - includes all statuses)
  const { data: allCreditsData } = useQuery({
    queryKey: ["project-credits-all", project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const response = await apiClient.get<{ credits: Credit[] }>(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects/${
          project.id
        }/credits/all`
      );
      setCredits(response.credits || []);
      return response.credits || [];
    },
    enabled: !!project?.id,
  });

  // Redirect if not owner
  useEffect(() => {
    if (project && isError) {
      navigate(`/p/${slug}`);
    }
  }, [isError, project, slug, navigate]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    } else if (formData.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters";
    }

    if (
      formData.description.trim() &&
      formData.description.trim().length < 10
    ) {
      errors.description =
        "Description must be at least 10 characters if provided";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDraft = async () => {
    setError("");
    setSaveSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.patch(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects/${project?.id}`,
        {
          title: formData.title.trim(),
          project_type: formData.projectType,
          description: formData.description.trim() || null,
          poster_url: formData.posterUrl.trim() || null,
        }
      );

      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save project";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setShowPublishDialog(false);
    setError("");
    setPublishLoading(true);

    try {
      await apiClient.patch(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects/${project?.id}`,
        {
          title: formData.title.trim(),
          project_type: formData.projectType,
          description: formData.description.trim() || null,
          poster_url: formData.posterUrl.trim() || null,
          publish: true,
        }
      );

      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["project", slug] });
      setTimeout(() => {
        navigate(`/p/${slug}`);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to publish project";
      setError(errorMessage);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAddCredit = async () => {
    setCreditError("");

    if (!creditFormData.job_title.trim()) {
      setCreditError("Job title is required");
      return;
    }

    if (
      !creditFormData.credited_user_id &&
      !creditFormData.credited_name.trim()
    ) {
      setCreditError("Please select a user or enter a name");
      return;
    }

    setCreditLoading(true);

    try {
      const newCredit = await apiClient.post<Credit>(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects/${
          project?.id
        }/credits`,
        {
          credit_type: creditFormData.credit_type,
          job_title: creditFormData.job_title.trim(),
          character_name: creditFormData.character_name.trim() || null,
          credited_user_id: creditFormData.credited_user_id || null,
          credited_name: creditFormData.credited_name.trim() || null,
        }
      );

      // Optimistically update UI
      setCredits([...credits, newCredit]);

      // Reset modal
      setShowAddCreditModal(false);
      setCreditFormData({
        credit_type: "CAST",
        job_title: "",
        character_name: "",
        useExistingUser: false,
        searchQuery: "",
        credited_user_id: "",
        credited_name: "",
      });
      setSearchResults([]);

      queryClient.invalidateQueries({ queryKey: ["project", slug] });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add credit";
      setCreditError(errorMessage);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setCreditFormData({
      ...creditFormData,
      searchQuery: query,
    });

    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const response = await apiClient.get<{
        results: Array<{
          user_id: string;
          username: string;
          display_name: string;
        }>;
      }>(
        `${
          import.meta.env.VITE_API_URL
        }/api/bmdb/users/search?q=${encodeURIComponent(query)}`
      );
      setSearchResults(response.results || []);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (
    userId: string,
    username: string,
    displayName: string
  ) => {
    setCreditFormData({
      ...creditFormData,
      credited_user_id: userId,
      searchQuery: username,
    });
    setSearchResults([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="py-12 lg:py-16">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-2xl space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-32" />
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
                  Back to Discover
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Edit Project
                </h1>
                <p className="text-muted-foreground">
                  Update your project details
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/p/${project.slug}`)}
              >
                View Project
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveDraft();
              }}
              className="space-y-6 bg-card p-6 rounded-lg border border-border"
            >
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                  Changes saved successfully!
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (validationErrors.title) {
                      setValidationErrors({ ...validationErrors, title: "" });
                    }
                  }}
                  placeholder="e.g., The Last Light"
                  required
                  disabled={loading}
                  className={validationErrors.title ? "border-destructive" : ""}
                />
                {validationErrors.title && (
                  <p className="text-xs text-destructive">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type *</Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectType: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="projectType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (validationErrors.description) {
                      setValidationErrors({
                        ...validationErrors,
                        description: "",
                      });
                    }
                  }}
                  placeholder="Tell us about your project..."
                  rows={5}
                  disabled={loading}
                  className={
                    validationErrors.description ? "border-destructive" : ""
                  }
                />
                {validationErrors.description && (
                  <p className="text-xs text-destructive">
                    {validationErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="posterUrl">Poster Image URL</Label>
                <Input
                  id="posterUrl"
                  value={formData.posterUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, posterUrl: e.target.value })
                  }
                  placeholder="https://example.com/poster.jpg"
                  disabled={loading}
                  type="url"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  variant="gold"
                  disabled={loading || publishLoading}
                >
                  {loading ? "Saving..." : "Save Draft"}
                </Button>
                {project?.status === "DRAFT" && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={loading || publishLoading}
                  >
                    {publishLoading ? "Publishing..." : "Publish Project"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/p/${slug}`)}
                  disabled={loading || publishLoading}
                >
                  Back to Project
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Status: <span className="font-semibold">{project?.status}</span>
                {project?.status === "PUBLISHED" && " • Live"}
                {project?.status === "DRAFT" && " • Not yet published"}
              </p>
            </form>

            {/* Credits Section */}
            <div className="mt-12 space-y-6 bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Credits
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCreditModal(true)}
                >
                  Add Credit
                </Button>
              </div>

              {credits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No credits added yet
                  </p>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setShowAddCreditModal(true)}
                  >
                    Add Your First Credit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {credits.map((credit) => (
                    <div
                      key={credit.id}
                      className="p-4 bg-background rounded-lg border border-border/50 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">
                            {credit.job_title}
                          </p>
                          {credit.character_name && (
                            <span className="text-xs text-muted-foreground">
                              ({credit.character_name})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {credit.credited_name || "—"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          credit.status === "VERIFIED"
                            ? "default"
                            : credit.status === "PENDING_ACCEPTANCE"
                            ? "secondary"
                            : "outline"
                        }
                        className="ml-4 shrink-0"
                      >
                        {credit.status === "VERIFIED"
                          ? "Verified"
                          : credit.status === "PENDING_ACCEPTANCE"
                          ? "Pending"
                          : credit.status === "UNCLAIMED"
                          ? "Unclaimed"
                          : credit.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Credit Modal */}
            <Dialog
              open={showAddCreditModal}
              onOpenChange={setShowAddCreditModal}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Credit</DialogTitle>
                  <DialogDescription>
                    Add a crew member or cast member to your project
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {creditError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      {creditError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="creditType">Type *</Label>
                    <Select
                      value={creditFormData.credit_type}
                      onValueChange={(value) =>
                        setCreditFormData({
                          ...creditFormData,
                          credit_type: value,
                        })
                      }
                      disabled={creditLoading}
                    >
                      <SelectTrigger id="creditType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CAST">Cast</SelectItem>
                        <SelectItem value="CREW">Crew</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Director, Actor, Cinematographer"
                      value={creditFormData.job_title}
                      onChange={(e) =>
                        setCreditFormData({
                          ...creditFormData,
                          job_title: e.target.value,
                        })
                      }
                      disabled={creditLoading}
                    />
                  </div>

                  {creditFormData.credit_type === "CAST" && (
                    <div className="space-y-2">
                      <Label htmlFor="characterName">Character Name</Label>
                      <Input
                        id="characterName"
                        placeholder="e.g., John Doe (optional)"
                        value={creditFormData.character_name}
                        onChange={(e) =>
                          setCreditFormData({
                            ...creditFormData,
                            character_name: e.target.value,
                          })
                        }
                        disabled={creditLoading}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Credit To *</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="nameRadio"
                          name="creditMethod"
                          checked={!creditFormData.useExistingUser}
                          onChange={() =>
                            setCreditFormData({
                              ...creditFormData,
                              useExistingUser: false,
                              credited_user_id: "",
                            })
                          }
                          disabled={creditLoading}
                        />
                        <Label htmlFor="nameRadio" className="cursor-pointer">
                          Name Only
                        </Label>
                      </div>
                      <Input
                        placeholder="Enter a name"
                        value={creditFormData.credited_name}
                        onChange={(e) =>
                          setCreditFormData({
                            ...creditFormData,
                            credited_name: e.target.value,
                          })
                        }
                        disabled={
                          creditLoading || creditFormData.useExistingUser
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="userRadio"
                          name="creditMethod"
                          checked={creditFormData.useExistingUser}
                          onChange={() =>
                            setCreditFormData({
                              ...creditFormData,
                              useExistingUser: true,
                              credited_name: "",
                            })
                          }
                          disabled={creditLoading}
                        />
                        <Label htmlFor="userRadio" className="cursor-pointer">
                          BMDB User
                        </Label>
                      </div>
                      {creditFormData.useExistingUser && (
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              placeholder="Search by username"
                              value={creditFormData.searchQuery}
                              onChange={(e) =>
                                handleSearchUsers(e.target.value)
                              }
                              disabled={creditLoading}
                              autoComplete="off"
                            />
                            {searchLoading && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Searching...
                              </div>
                            )}
                            {searchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                {searchResults.map((user) => (
                                  <button
                                    key={user.user_id}
                                    type="button"
                                    onClick={() =>
                                      handleSelectUser(
                                        user.user_id,
                                        user.username,
                                        user.display_name
                                      )
                                    }
                                    className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors border-b border-border/50 last:border-b-0"
                                  >
                                    <div className="font-medium text-sm">
                                      {user.username}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {user.display_name}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {creditFormData.credited_user_id && (
                        <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                          <div>
                            <div className="text-sm font-medium">
                              {creditFormData.searchQuery}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {creditFormData.credited_user_id}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCreditFormData({
                                ...creditFormData,
                                credited_user_id: "",
                                searchQuery: "",
                              })
                            }
                            className="p-1 hover:bg-background rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddCredit}
                      disabled={creditLoading}
                      className="flex-1"
                      variant="gold"
                    >
                      {creditLoading ? "Adding..." : "Add Credit"}
                    </Button>
                    <Button
                      onClick={() => setShowAddCreditModal(false)}
                      disabled={creditLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={showPublishDialog}
              onOpenChange={setShowPublishDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your project will be visible to everyone on BMDB. You can
                    still make edits after publishing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction
                  onClick={handlePublish}
                  disabled={publishLoading}
                  className="bg-gold hover:bg-gold/90"
                >
                  {publishLoading ? "Publishing..." : "Publish"}
                </AlertDialogAction>
                <AlertDialogCancel disabled={publishLoading}>
                  Cancel
                </AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
