import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

function formatPrice(n) { return '$' + Number(n || 0).toLocaleString(); }

export default function MyListings({ user }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('properties').select('*').eq('lister_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [user]);

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('properties').delete().eq('id', id);
    setListings(l => l.filter(p => p.id !== id));
  };

  const BADGES = { sale_auction:'🏷️ Auction', sale_fixed:'🏠 Sale', rent_auction:'🔑 Rent Bid', rent_fixed:'📋 Rent' };

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-900">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-navy-800 text-slate-400"><ArrowLeft size={16} /></button>
        <h1 className="text-white font-black text-lg">My Listings</h1>
        <button onClick={() => navigate('/list')} className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-amber-500 rounded-xl text-black font-bold text-xs">
          <Plus size={14} />List
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}
        {!loading && listings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏡</div>
            <p className="text-slate-400">No listings yet.</p>
            <button onClick={() => navigate('/list')} className="mt-3 px-4 py-2 bg-amber-500 rounded-xl text-black font-bold text-sm">+ List a Property</button>
          </div>
        )}
        {listings.map(p => (
          <div key={p.id} className="bg-navy-900 border border-navy-700 rounded-2xl overflow-hidden">
            <div className="relative h-32">
              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} alt={p.address} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {BADGES[p.listing_type] || 'Listing'}
              </div>
            </div>
            <div className="p-3">
              <p className="text-white font-bold text-sm">{p.address}</p>
              <p className="text-slate-400 text-xs">{p.city}, {p.state}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-amber-400 font-black">{formatPrice(p.current_bid || p.asking_price || p.starting_price || p.monthly_rate)}</p>
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <span>{p.bid_count || 0} bids</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate(`/property/${p.id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-navy-700 rounded-xl text-white text-xs font-semibold">
                  <Eye size={13} /> View
                </button>
                <button onClick={() => deleteListing(p.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-900/40 border border-red-700 rounded-xl text-red-400 text-xs font-semibold">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
