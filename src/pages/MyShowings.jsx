import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function MyShowings({ user }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('buyer');
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const field = tab === 'buyer' ? 'buyer_id' : 'seller_email';
    const val = tab === 'buyer' ? user.id : user.email;
    supabase.from('showings').select('*, properties(address,city,state)').eq(field, val).order('requested_date', { ascending: true })
      .then(({ data }) => { setShowings(data || []); setLoading(false); });
  }, [user, tab]);

  const updateStatus = async (id, status, counterDate = null, counterTime = null) => {
    const update = { status };
    if (counterDate) { update.counter_date = counterDate; update.counter_time = counterTime; }
    await supabase.from('showings').update(update).eq('id', id);
    setShowings(s => s.map(sh => sh.id === id ? { ...sh, ...update } : sh));
  };

  const STATUS_COLOR = { pending: 'text-amber-400', confirmed: 'text-green-400', declined: 'text-red-400', countered: 'text-blue-400' };

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-900">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-navy-800 text-slate-400"><ArrowLeft size={16} /></button>
        <h1 className="text-white font-black text-lg">Showings</h1>
      </div>

      <div className="flex border-b border-navy-700 bg-navy-900">
        <button onClick={() => setTab('buyer')} className={`flex-1 py-2.5 text-xs font-semibold ${tab==='buyer'?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>As Buyer</button>
        <button onClick={() => setTab('seller')} className={`flex-1 py-2.5 text-xs font-semibold ${tab==='seller'?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>As Seller</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}
        {!loading && showings.length === 0 && <div className="text-center text-slate-400 py-12">No showings yet.</div>}
        {showings.map(sh => (
          <div key={sh.id} className="bg-navy-900 border border-navy-700 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-bold text-sm">{sh.properties?.address || 'Property'}</p>
                <p className="text-slate-400 text-xs">{sh.properties?.city}, {sh.properties?.state}</p>
              </div>
              <span className={`text-xs font-bold capitalize ${STATUS_COLOR[sh.status] || 'text-slate-400'}`}>{sh.status}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 text-xs">
              <Calendar size={12} />
              <span>{sh.counter_date || sh.requested_date} at {sh.counter_time || sh.requested_time}</span>
            </div>
            {sh.notes && <p className="text-slate-400 text-xs italic">"{sh.notes}"</p>}
            {tab === 'seller' && sh.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => updateStatus(sh.id, 'confirmed')} className="flex-1 py-2 bg-green-700 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1"><CheckCircle size={12} /> Confirm</button>
                <button onClick={() => updateStatus(sh.id, 'declined')} className="flex-1 py-2 bg-red-900/50 border border-red-700 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-1"><XCircle size={12} /> Decline</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
