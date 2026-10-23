import React from 'react';
import Link from 'next/link';
import type { RoommatePost } from '../../types/index.js';
import { formatMAD, formatDate, CAMPUS_DETAILS } from '../../lib/utils.js';
import { Calendar, Wallet } from 'lucide-react';

export function RoommateCard({ post }: { post: RoommatePost }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white hover:border-gray-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
            {CAMPUS_DETAILS[post.campus]?.city || post.campus}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {post.preferredRoommateGender === 'ANY'
              ? 'Mixte'
              : post.preferredRoommateGender === 'MALE'
              ? 'Homme'
              : 'Femme'}
          </span>
        </div>

        <Link href={`/roommates/${post.id}`} className="block">
          <h3 className="text-sm font-semibold text-gray-900 hover:text-brand-600 line-clamp-1 transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Author info if present */}
        {post.author?.firstName && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Par <span className="font-medium text-gray-800">{post.author.firstName} {post.author.lastName}</span>
            {post.author.isVerified && <span className="text-brand-600 font-semibold ml-1">✓ Vérifié</span>}
          </p>
        )}

        <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
          {post.description}
        </p>

        {/* Lifestyle badges */}
        {post.lifestyleHabits && post.lifestyleHabits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.lifestyleHabits.slice(0, 3).map((habit, idx) => (
              <span
                key={idx}
                className="text-[10px] text-gray-600 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded"
              >
                {habit}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 font-semibold text-gray-900">
            <Wallet className="w-3.5 h-3.5 text-gray-400" />
            <span>Max {formatMAD(post.budgetMax)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(post.targetMoveInDate)}</span>
          </div>
        </div>

        <Link
          href={`/roommates/${post.id}`}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 shrink-0"
        >
          <span>Détails</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
