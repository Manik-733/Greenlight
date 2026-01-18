import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Film, User as UserIcon, Filter, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/project/ProjectCard';
import { mockProjects, mockUsers } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type SearchTab = 'projects' | 'people';

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('projects');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
    }
  };

  // Mock filtered results
  const filteredProjects = mockProjects.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.synopsis?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(u =>
    u.displayName.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.bio?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      {/* Search Header */}
      <section className="py-12 lg:py-16 border-b border-border">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-8">
              Search
            </h1>

            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects, filmmakers, roles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-14 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </form>

            {/* Tabs */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant={activeTab === 'projects' ? 'gold' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('projects')}
              >
                <Film className="h-4 w-4 mr-2" />
                Projects
              </Button>
              <Button
                variant={activeTab === 'people' ? 'gold' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('people')}
              >
                <UserIcon className="h-4 w-4 mr-2" />
                People
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-6 lg:px-12">
          {!hasSearched && !query ? (
            // Initial state
            <div className="text-center py-16">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-display text-xl text-muted-foreground">
                Start typing to search
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Find projects, filmmakers, and roles across the database
              </p>
            </div>
          ) : activeTab === 'projects' ? (
            // Projects results
            <div>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No projects found for "{query}"</p>
                </div>
              )}
            </div>
          ) : (
            // People results
            <div>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
                </p>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link 
                        to={`/u/${user.username}`}
                        className="block bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="font-display text-xl text-muted-foreground">
                                  {user.displayName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-lg font-semibold text-foreground">
                              {user.displayName}
                            </h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.bio && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {user.bio}
                              </p>
                            )}
                            {user.location && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {user.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No people found for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
