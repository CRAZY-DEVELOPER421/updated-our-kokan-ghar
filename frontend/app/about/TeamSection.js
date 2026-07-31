'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/utils';
import api from '@/lib/api';

function SocialIcon({ platform, url }) {
  if (!url) return null;
  const icons = {
    instagram: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    facebook: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    linkedin: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    twitter: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>,
  };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-konkan-text-secondary hover:text-konkan-green-primary transition-colors" onClick={(e) => e.stopPropagation()} aria-label={`${platform} profile`}>
      {icons[platform] || null}
    </a>
  );
}

function MemberCard({ member, onClick }) {
  return (
    <div
      onClick={() => onClick(member)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(member); } }}
      role="button"
      tabIndex={0}
      className="text-center group w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-konkan-green-primary/50 rounded-xl"
    >
      <div className="w-24 h-24 mx-auto rounded-full bg-konkan-green-primary/10 overflow-hidden mb-4 ring-2 ring-transparent group-hover:ring-konkan-green-primary/30 group-focus:ring-konkan-green-primary/50 transition-all">
        {member.image_url ? (
          <Image src={getImageUrl(member.image_url)} alt={member.name} fill className="object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-konkan-green-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        )}
      </div>
      <h3 className="font-display font-bold text-konkan-text-primary group-hover:text-konkan-green-primary transition-colors">{member.name}</h3>
      <p className="text-xs text-konkan-saffron font-medium">{member.designation}</p>
      {member.experience_years > 0 && <p className="text-[10px] text-konkan-text-secondary mt-0.5">{member.experience_years} years experience</p>}
      <p className="text-xs text-konkan-text-secondary mt-1.5 max-w-xs mx-auto line-clamp-2">{member.short_bio}</p>
      <div className="flex items-center justify-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
        <SocialIcon platform="instagram" url={member.instagram} />
        <SocialIcon platform="facebook" url={member.facebook} />
        <SocialIcon platform="linkedin" url={member.linkedin} />
        <SocialIcon platform="twitter" url={member.twitter} />
      </div>
    </div>
  );
}

function MemberDetailModal({ member, onClose }) {
  if (!member) return null;

  const skills = member.skills ? member.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const achievements = member.achievements ? member.achievements.split('\n').filter(Boolean) : [];
  const certifications = member.certifications ? member.certifications.split('\n').filter(Boolean) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-white transition-all shadow-md"
          aria-label="Close detail modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-konkan-green-primary/10 to-konkan-cream p-6 sm:p-8 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-white/80 overflow-hidden mb-4 shadow-lg ring-4 ring-white">
            {member.image_url ? (
              <Image src={getImageUrl(member.image_url)} alt={member.name} fill sizes="96px" className="object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-bold text-konkan-green-primary">{member.name?.charAt(0)}</span>
              </div>
            )}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-konkan-text-primary">{member.name}</h2>
          <p className="text-sm text-konkan-saffron font-medium">{member.designation}</p>
          {member.specialization && (
            <p className="text-xs text-konkan-text-secondary mt-0.5">{member.specialization}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <SocialIcon platform="instagram" url={member.instagram} />
            <SocialIcon platform="facebook" url={member.facebook} />
            <SocialIcon platform="linkedin" url={member.linkedin} />
            <SocialIcon platform="twitter" url={member.twitter} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Quick Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {member.experience_years > 0 && (
              <div className="bg-konkan-cream/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-konkan-green-primary">{member.experience_years}+</p>
                <p className="text-[10px] text-konkan-text-secondary">Years Exp.</p>
              </div>
            )}
            {member.email && (
              <div className="bg-konkan-cream/50 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-konkan-text-primary truncate">{member.email}</p>
                <p className="text-[10px] text-konkan-text-secondary">Email</p>
              </div>
            )}
            {member.phone && (
              <div className="bg-konkan-cream/50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-konkan-text-primary">{member.phone}</p>
                <p className="text-[10px] text-konkan-text-secondary">Phone</p>
              </div>
            )}
            {member.joining_date && (
              <div className="bg-konkan-cream/50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-konkan-text-primary">
                  {new Date(member.joining_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                </p>
                <p className="text-[10px] text-konkan-text-secondary">Joined</p>
              </div>
            )}
          </div>

          {/* Bio */}
          {member.short_bio && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-konkan-text-secondary mb-1.5">About</h4>
              <p className="text-sm text-konkan-text-primary leading-relaxed">{member.short_bio}</p>
            </div>
          )}

          {/* Biography */}
          {member.biography && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-konkan-text-secondary mb-1.5">Full Biography</h4>
              <p className="text-sm text-konkan-text-primary leading-relaxed whitespace-pre-line">{member.biography}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-konkan-text-secondary mb-1.5">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-konkan-green-primary/10 text-konkan-green-primary rounded-full text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-konkan-text-secondary mb-1.5">Achievements</h4>
              <ul className="space-y-1">
                {achievements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-konkan-text-primary">
                    <svg className="w-4 h-4 text-konkan-saffron mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-konkan-text-secondary mb-1.5">Certifications</h4>
              <ul className="space-y-1">
                {certifications.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-konkan-text-primary">
                    <svg className="w-4 h-4 text-konkan-success mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-konkan-green-primary text-white rounded-xl font-medium hover:bg-konkan-green-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamSection() {
  const [selectedMember, setSelectedMember] = useState(null);

  const { data: teamData } = useQuery({
    queryKey: ['about-team'],
    queryFn: async () => {
      const res = await api.get('/cms/team?featured=false');
      return res.data.data;
    },
  });

  const members = teamData?.members || [];

  if (members.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-konkan-text-secondary">
        <svg className="w-12 h-12 mx-auto mb-3 text-konkan-green-primary/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <p>Meet our team coming soon!</p>
      </div>
    );
  }

  return (
    <>
      {members.map((member) => (
        <MemberCard key={member.id} member={member} onClick={setSelectedMember} />
      ))}

      <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </>
  );
}
