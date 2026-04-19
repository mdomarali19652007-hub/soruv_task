/**
 * News feed screen (likes + comments).
 *
 * First feature screen extracted out of the src/App.tsx monolith.
 * Behaviour is unchanged: same updateRow targets, same OperationType
 * semantics, same error handling. The closure dependencies are now
 * explicit props instead of hidden outer-scope reads.
 */

import { useState } from 'react';
import { ArrowLeft, Check, MessageSquare, Send, Share2, ThumbsUp } from 'lucide-react';
import type { NewsPost, UserProfile, View } from '../../types';
import { OperationType } from '../../types';
import { handleDbError } from '../../utils/db-errors';

interface Props {
  newsPosts: NewsPost[];
  user: Pick<UserProfile, 'id' | 'name'>;
  setView: (view: View) => void;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function TopNewsView({ newsPosts, user, setView, updateRow }: Props) {
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});

  const handleLike = async (postId: string) => {
    const post = newsPosts.find((p) => p.id === postId);
    if (!post) return;

    const newLikes = post.likes.includes(user.id)
      ? post.likes.filter((id) => id !== user.id)
      : [...post.likes, user.id];

    try {
      await updateRow('newsPosts', postId, { likes: newLikes });
    } catch (e) {
      handleDbError(e, OperationType.UPDATE, `newsPosts/${postId}`);
    }
  };

  const handleComment = async (postId: string) => {
    const text = newComment[postId];
    if (!text?.trim()) return;

    const post = newsPosts.find((p) => p.id === postId);
    if (!post) return;

    const comment = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      text: text.trim(),
      timestamp: Date.now(),
    };

    try {
      await updateRow('newsPosts', postId, {
        comments: [...post.comments, comment],
      });
      setNewComment({ ...newComment, [postId]: '' });
    } catch (e) {
      handleDbError(e, OperationType.UPDATE, `newsPosts/${postId}`);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-100">
      <div className="p-4 pt-12 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setView('home')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-slate-900">Top News</h2>
        </div>

        <div className="space-y-4">
          {newsPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black">
                  {post.authorName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="font-bold text-sm text-slate-900">{post.authorName}</h4>
                    {post.authorBadge && (
                      <div className="bg-blue-500 rounded-full p-0.5">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{new Date(post.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="w-full aspect-video bg-slate-100">
                  <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Stats */}
              <div className="px-4 py-2 flex items-center justify-between border-t border-slate-50 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="bg-blue-500 rounded-full p-1">
                    <ThumbsUp className="w-2 h-2 text-white" />
                  </div>
                  <span>{post.likes.length}</span>
                </div>
                <div>{post.comments.length} comments</div>
              </div>

              {/* Actions */}
              <div className="px-2 py-1 flex items-center border-t border-slate-50">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    post.likes.includes(user.id) ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${post.likes.includes(user.id) ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold">Like</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold">Comment</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Share</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="bg-slate-50 p-4 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                      {comment.userName[0]}
                    </div>
                    <div className="bg-white p-2 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                      <h5 className="text-[10px] font-black text-slate-900">{comment.userName}</h5>
                      <p className="text-xs text-slate-700">{comment.text}</p>
                    </div>
                  </div>
                ))}

                {/* Comment Input */}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment[post.id] || ''}
                    onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
