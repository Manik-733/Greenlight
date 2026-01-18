import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Edit, Trash2, Flag } from 'lucide-react';
import { Comment } from '@/types/bmdb';
import { formatRelativeTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  comments: Comment[];
  isLoggedIn?: boolean;
  currentUserId?: string;
  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export function CommentSection({
  comments,
  isLoggedIn = false,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const maxLength = 1000;

  const handleSubmit = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    if (editContent.trim() && onEditComment) {
      onEditComment(commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl font-semibold text-foreground">
        Discussion
      </h3>

      {/* Comment composer */}
      {isLoggedIn ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <Textarea
            placeholder="Share your thoughts on this project... Keep it constructive."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value.slice(0, maxLength))}
            className="min-h-[100px] resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className={cn(
              "text-xs",
              newComment.length > maxLength * 0.9 
                ? "text-status-pending" 
                : "text-muted-foreground"
            )}>
              {newComment.length}/{maxLength}
            </span>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">Sign in</a> to join the discussion
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.user?.avatarUrl} alt={comment.user?.displayName} />
                  <AvatarFallback className="bg-secondary text-muted-foreground font-medium">
                    {comment.user?.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/u/${comment.user?.username}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {comment.user?.displayName}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                      )}
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentUserId === comment.userId && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(comment)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteComment?.(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem>
                          <Flag className="h-4 w-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value.slice(0, maxLength))}
                        className="min-h-[80px]"
                      />
                      <div className="mt-2 flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
