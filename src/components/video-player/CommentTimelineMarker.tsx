"use client";

import { cn, formatRelativeTime, formatTimestamp, getInitials } from "@/lib/utils";

export interface TimelineComment {
  _id: string;
  timestampSeconds: number;
  resolved: boolean;
  text?: string;
  userName?: string;
  userAvatarUrl?: string;
  _creationTime?: number;
}

interface CommentTimelineMarkerProps {
  comment: TimelineComment;
  isActive: boolean;
  position: number;
  onSelect: (comment: TimelineComment) => void;
}

/** Returns an edge-aware popover alignment for markers near the timeline bounds. */
function getPopoverAlignment(position: number) {
  if (position < 14) return "left-0";
  if (position > 86) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/** Renders a timeline comment marker with hover and playback-proximity previews. */
export function CommentTimelineMarker({
  comment,
  isActive,
  position,
  onSelect,
}: CommentTimelineMarkerProps) {
  const userName = comment.userName ?? "Comment";
  const text = comment.text?.trim() || "No comment text";
  const isResolved = comment.resolved;

  return (
    <div
      className={cn(
        "group absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
        isActive ? "z-30" : "z-10",
      )}
      style={{ left: `${position}%` }}
    >
      <button
        type="button"
        className={cn(
          "block h-3 w-3 rounded-full border border-black/40 shadow transition",
          isResolved ? "bg-green-400" : "bg-orange-400",
          isActive && "ring-2 ring-white/70",
        )}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(comment);
        }}
        aria-label={`Jump to comment at ${formatTimestamp(comment.timestampSeconds)}`}
      />

      <div
        className={cn(
          "pointer-events-none absolute bottom-5 w-[min(21rem,calc(100vw-2rem))] rounded-lg border border-white/10 bg-[#27293b]/95 p-3 text-left text-white shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur transition duration-150",
          getPopoverAlignment(position),
          isActive
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-1 scale-[0.98] opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100",
        )}
      >
        <div className="mb-2 flex items-start gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[color:var(--accent)] text-xs font-black text-white">
            {comment.userAvatarUrl ? (
              <img src={comment.userAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              getInitials(userName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm font-semibold">{userName}</span>
              {comment._creationTime ? (
                <span className="flex-shrink-0 text-xs text-white/45">{formatRelativeTime(comment._creationTime)}</span>
              ) : null}
            </div>
            <div className="mt-0.5 font-mono text-xs font-semibold text-yellow-300">
              {formatTimestamp(comment.timestampSeconds)}
            </div>
          </div>
        </div>
        <p className="max-h-28 overflow-hidden whitespace-pre-wrap text-sm leading-relaxed text-white/90">
          {text}
        </p>
      </div>
    </div>
  );
}
