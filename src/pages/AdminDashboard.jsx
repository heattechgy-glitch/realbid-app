import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Users, Calendar, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

function formatPrice(n) { return '$' + Number(n || 0).toLocaleString(); }

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('properties');
  const [data, setData] = useState({ properties: [], showings: [], escrow: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('showings').select('*').order('created_at', { ascending: false }),
      supabase.from('escrow_companies').select('*').order('name'),
    ]).then(([{ data: props }, { data: shows }, { data: esc }]) => {
      setData({ properties: props||[], showings: shows||[], escrow: esc||[] });
      setLoading(false);
    });
  }, [user]);

  const updatePropertyStatus = async (id, status) => {
    await supabase.from('properties').update({ status }).eq('id', id);
    setData(d => ({ ...d, properties: d.properties.map(p => p.id===id ? {...p,status} : p) }));
  };

  const TABS = [
    { key: 'properties', label: 'Properties', icon: Home },
    { key: 'showings', label: 'Showings', icon: Calendar },
    { key: 'escrow', label: 'Escrow', icon: Shield },
  ];

  const LISTING_TYPES = { sale_auction:'Auction', sale_fixed:'Sale', rent_auction:'Rent Bid', rent_fixed:'Rent' };
  const STATUS_COLORS = { active:'text-green-400', pending:'text-amber-400', closed:'text-slate-400', archived:'text-red-400' };

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-900">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-navy-800 text-slate-400"><ArrowLeft size={16} /></button>
        <h1 className="text-white font-black text-lg">Admin Panel</h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-navy-900 border-b border-navy-700">
        {[['Properties', data.properties.length], ['Showings', data.showings.length], ['Escrow', data.escrow.length]].map(([l, v]) => (
          <div key={l} className="bg-navy-800 rounded-xl p-2 text-center">
            <p className="text-amber-400 font-black text-xl">{v}</p>
            <p className="text-slate-400 text-xs">{l}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-navy-700 bg-navy-900">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold ${tab===key?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}

        {tab === 'properties' && data.properties.map(p => (
          <div key={p.id} className="bg-navy-900 border border-navy-700 rounded-xl p-3">
            <div className="flex justify-between items-start mb-1">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{p.address}</p>
                <p className="text-slate-400 text-xs">{p.city}, {p.state} • {LISTING_TYPES[p.listing_type]||p.listing_type}</p>
              </div>
              <span className={`text-xs font-bold ml-2 ${STATUS_COLORS[p.status]||'text-slate-400'}`}>{p.status}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-amber-400 font-bold text-sm">{formatPrice(p.current_bid||p.asking_price||p.starting_price)} • {p.bid_count||0} bids</p>
              <div className="flex gap-1">
                {p.status !== 'active' && <button onClick={() => updatePropertyStatus(p.id, 'active')} className="px-2 py-1 bg-green-800 rounded text-green-300 text-[10px] font-bold">Activate</button>}
                {p.status === 'active' && <button onClick={() => updatePropertyStatus(p.id, 'archived')} className="px-2 py-1 bg-red-900/50 border border-red-700 rounded text-red-400 text-[10px] font-bold">Archive</button>}
              </div>
            </div>
          </div>
        ))}

        {tab === 'showings' && data.showings.map(s => (
          <div key={s.id} className="bg-navy-900 border border-navy-700 rounded-xl p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-bold">{s.buyer_name || 'Buyer'}</p>
                <p className="text-slate-400 text-xs">{s.requested_date} at {s.requested_time}</p>
                {s.lister_notes && <p className="text-slate-500 text-xs italic mt-1">"{s.lister_notes}"</p>}
              </div>
              <span className={`text-xs font-bold capitalize ${s.status==='confirmed'?'text-green-400':s.status==='pending'?'text-amber-400':'text-red-400'}`}>{s.status}</span>
            </div>
          </div>
        ))}

        {tab === 'escrow' && data.escrow.map(e => (
          <div key={e.id} className="bg-navy-900 border border-navy-700 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-sm font-bold">{e.name}</p>
                <p className="text-slate-400 text-xs">{e.email}</p>
                {e.states_available && <p className="text-slate-500 text-xs">States: {e.states_available}</p>}
              </div>
              <span className={`text-xs font-bold ${e.is_active ? 'text-green-400' : 'text-red-400'}`}>{e.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
