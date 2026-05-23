import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gavel, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

function formatPrice(n) { return '$' + Number(n || 0).toLocaleString(); }

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-green-400', icon: Clock },
  outbid: { label: 'Outbid', color: 'text-red-400', icon: XCircle },
  won: { label: 'Won!', color: 'text-amber-400', icon: CheckCircle },
  lost: { label: 'Lost', color: 'text-slate-400', icon: XCircle },
};

export default function MyBids({ user }) {
  const navigate = useNavigate();
  const [bids, setBids] = useState([]);
  const [properties, setProperties] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('bids').select('*').eq('bidder_id', user.id).order('created_at', { ascending: false })
      .then(async ({ data: b }) => {
        setBids(b || []);
        // Fetch property details for each bid
        const ids = [...new Set((b||[]).map(bid => bid.property_id))];
        if (ids.length > 0) {
          const { data: props } = await supabase.from('properties').select('id,address,city,state,images,listing_type,auction_end_date').in('id', ids);
          const map = {};
          (props||[]).forEach(p => { map[p.id] = p; });
          setProperties(map);
        }
        setLoading(false);
      });
  }, [user]);

  if (!user) return (
    <div className="h-dvh bg-navy-950 flex flex-col items-center justify-center gap-3 p-6">
      <p className="text-slate-400">Sign in to view your bids.</p>
      <button onClick={() => navigate('/')} className="px-4 py-2 bg-amber-500 rounded-xl text-black font-bold text-sm">Go Home</button>
    </div>
  );

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-900">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-navy-800 text-slate-400"><ArrowLeft size={16} /></button>
        <h1 className="text-white font-black text-lg">My Bids</h1>
        <span className="ml-auto text-slate-400 text-sm">{bids.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}
        {!loading && bids.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏷️</div>
            <p className="text-slate-400">No bids yet.</p>
            <button onClick={() => navigate('/')} className="mt-3 px-4 py-2 bg-amber-500 rounded-xl text-black font-bold text-sm">Browse Properties</button>
          </div>
        )}
        {bids.map(bid => {
          const prop = properties[bid.property_id];
          const cfg = STATUS_CONFIG[bid.status] || STATUS_CONFIG.active;
          const Icon = cfg.icon;
          return (
            <div key={bid.id} onClick={() => navigate(`/property/${bid.property_id}`)}
              className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden cursor-pointer active:scale-98 transition-transform">
              <div className="flex gap-3 p-3">
                {prop?.images?.[0] && (
                  <img src={prop.images[0]} alt={prop?.address} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{prop?.address || 'Property'}</p>
                  <p className="text-slate-400 text-xs">{prop?.city}, {prop?.state}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-amber-400 font-black">{formatPrice(bid.amount)}</p>
                    <div className={`flex items-center gap-1 ${cfg.color}`}>
                      <Icon size={12} />
                      <span className="text-xs font-semibold">{cfg.label}</span>
                    </div>
                  </div>
                </div>
              </div>
              {bid.status === 'won' || bid.status === 'active' ? (
                <div className="px-3 pb-3">
                  <div className={`flex items-center justify-between p-2 rounded-xl border ${bid.earnest_paid ? 'bg-green-900/20 border-green-700' : 'bg-amber-900/20 border-amber-700'}`}>
                    <p className="text-xs text-slate-300">Earnest Money ({formatPrice(bid.earnest_amount)})</p>
                    <span className={`text-xs font-bold ${bid.earnest_paid ? 'text-green-400' : 'text-amber-400'}`}>
                      {bid.earnest_paid ? '✅ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
