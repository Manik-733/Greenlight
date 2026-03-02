import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useApiClient } from "@/lib/api-client";

const PROJECT_TYPES = [
  { value: "SHORT", label: "Short Film" },
  { value: "FEATURE", label: "Feature Film" },
  { value: "DOCUMENTARY", label: "Documentary" },
  { value: "WEB_SERIES", label: "Web Series" },
  { value: "SCENE", label: "Scene/Clip" },
  { value: "OTHER", label: "Other" },
];

export default function CreateProject() {
  const navigate = useNavigate();
  const apiClient = useApiClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectType: "SHORT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<{ id: string; slug: string }>(
        `${import.meta.env.VITE_API_URL}/api/bmdb/projects`,
        {
          title: formData.title.trim(),
          project_type: formData.projectType,
          description: formData.description.trim() || null,
        },
      );

      // Redirect to project edit page
      navigate(`/p/${response.slug}/edit`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create project";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="mb-8">
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Create a New Project
              </h1>
              <p className="text-muted-foreground">
                Add your film, short, or creative work to Greenlight
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 bg-card p-6 rounded-lg border border-border"
            >
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
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

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="gold" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/discover")}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                * Required fields. You can add more details like poster image,
                cast & crew after creation.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
