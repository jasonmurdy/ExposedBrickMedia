import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Shield, Box, Users as UsersIcon, ChevronRight, Mail, Phone, ExternalLink, Globe, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../lib/SiteContentContext';
import { Helmet } from 'react-helmet-async';

export function TeamProfile() {
  const { teamId } = useParams();
  const { isLight } = useSiteContent();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    // Load Team
    const unsubTeam = onSnapshot(doc(db, 'teams', teamId), (snap) => {
      if (snap.exists()) {
        setTeam({ id: snap.id, ...snap.data() });
      } else {
        setTeam(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `teams/${teamId}`);
      setLoading(false);
    });

    // Load Team Members
    const qMembers = query(collection(db, 'users'), where('teamId', '==', teamId));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Member load failed:", err);
    });

    return () => {
      unsubTeam();
      unsubMembers();
    };
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-brick-copper font-display italic text-2xl">Synchronizing Collective...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8 text-center">
        <UsersIcon size={48} className="text-text-primary/10 mb-6" />
        <h1 className="font-display text-4xl italic mb-4">Collective Not Found</h1>
        <p className="text-text-primary/40 uppercase tracking-widest text-[10px] mb-8">The strategic team you are seeking has not been initialized.</p>
        <Link to="/" className="px-8 py-4 bg-brick-copper text-charcoal text-[10px] uppercase font-black tracking-widest hover:bg-white transition-all">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-bg-primary text-text-primary transition-colors duration-500 ${isLight ? 'light' : ''}`}>
      <Helmet>
        <title>{`${team.name} | Strategic Collective | Exposed Brick Media`}</title>
        <meta name="description" content={`Experience the architectural narratives of ${team.name}. A unified collective of real estate professionals.`} />
      </Helmet>

      {/* Hero Header */}
      <section className="bg-charcoal pt-32 pb-24 px-8 md:px-16 lg:px-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 text-white pointer-events-none">
          <Box size={300} strokeWidth={0.5} />
        </div>
        
        <div className="max-w-6xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="w-16 h-[1px] bg-brick-copper" />
            <span className="text-[11px] uppercase tracking-[0.5em] text-brick-copper font-black">Strategic Collective</span>
          </motion.div>
          
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-white italic lowercase leading-tight mb-12">
            {team.name}<span className="text-brick-copper">.</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <p className="text-white/60 text-xl md:text-2xl font-serif italic leading-relaxed max-w-xl">
              "{team.description || 'A unified collective of real estate professionals committed to architectural excellence and strategic narrative delivery.'}"
            </p>
            {team.brandGuideUrl && (
              <div className="flex justify-start md:justify-end">
                <a 
                  href={team.brandGuideUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-brick-copper border border-brick-copper/20 px-8 py-4 hover:bg-brick-copper hover:text-charcoal transition-all"
                >
                  <Globe size={14} /> Collective Standards
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Team Roster */}
      <section className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-32">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-[12px] uppercase tracking-[0.5em] font-black text-text-primary/40 flex items-center gap-6">
            <span className="w-12 h-[1px] bg-border-subtle" /> The Roster
          </h2>
          <span className="font-mono text-[10px] text-brick-copper">{members.length} Synchronized Advisors</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {members.map((member) => (
            <Link key={member.id} to={`/partners/${member.id}`} className="group space-y-6">
               <div className="relative aspect-square overflow-hidden bg-text-primary/5 p-1 border border-border-subtle group-hover:border-brick-copper/40 transition-all duration-500">
                  <div className="w-full h-full overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                    {member.headshotUrl ? (
                      <img src={member.headshotUrl} alt="" className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10">
                        <Shield size={120} strokeWidth={0.5} />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-brick-copper" />
                  </div>
               </div>
               
               <div className="text-center group-hover:translate-y-[-4px] transition-transform duration-300">
                 <h4 className="font-display text-2xl italic mb-1">{member.displayName}</h4>
                 <p className="text-[9px] uppercase tracking-widest text-brick-copper font-black">{member.role || 'Strategic Advisor'}</p>
                 <div className="flex justify-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {member.email && <Mail size={14} className="text-text-primary/30 hover:text-brick-copper transition-colors" />}
                    {member.phone && <Phone size={14} className="text-text-primary/30 hover:text-brick-copper transition-colors" />}
                 </div>
               </div>
            </Link>
          ))}
          {members.length === 0 && (
             <div className="col-span-full py-24 text-center border border-dashed border-border-subtle opacity-20">
               <UsersIcon size={48} className="mx-auto mb-4" />
               <p className="text-[10px] uppercase tracking-widest">No advisors currently assigned to this collective.</p>
             </div>
          )}
        </div>
      </section>

      {/* Collective Brand Block */}
      {team.logoUrl && (
        <section className="py-24 border-t border-border-subtle text-center">
          <div className="max-w-xs mx-auto opacity-20 hover:opacity-100 transition-opacity duration-1000">
            <img src={team.logoUrl} alt="Collective Identity" className="w-full h-auto grayscale brightness-125" />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-bg-primary py-32 px-8 flex flex-col items-center border-t border-border-subtle">
        <h2 className="font-display text-4xl md:text-6xl text-center italic mb-12">Expand your strategic reach<span className="text-brick-copper">.</span></h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link to="/inquiry" className="px-12 py-5 bg-charcoal text-white text-[10px] uppercase font-black tracking-widest hover:bg-brick-copper hover:text-charcoal transition-all">
            Initiate Assignment
          </Link>
          <Link to="/" className="px-12 py-5 border border-border-subtle text-[10px] uppercase font-black tracking-widest hover:bg-text-primary hover:text-bg-primary transition-all">
            Return to Agency
          </Link>
        </div>
      </section>
    </div>
  );
}
