import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MODES = [
  { key: 'sale_auction', label: '🏷️ Auction' },
  { key: 'sale_fixed', label: '🏠 Fixed Sale' },
  { key: 'rent_auction', label: '🔑 Rent Bid' },
  { key: 'rent_fixed', label: '📋 Fixed Rent' },
];

export default function ListProperty({ user }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('sale_auction');
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip: '',
    bedrooms: '', bathrooms: '', sq_ft: '', year_built: '', description: '',
    starting_price: '', asking_price: '', monthly_rate: '', reserve_price: '',
    auction_end_date: '', lease_term: '', available_date: '',
    lister_name: user?.full_name || '', lister_email: user?.email || '', lister_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.address || !form.city || !form.state) { alert('Address, city, and state are required.'); return; }
    if (!user) { alert('Please sign in to list a property.'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        listing_type: mode,
        lister_id: user.id,
        status: 'active',
        bedrooms: +form.bedrooms || null,
        bathrooms: +form.bathrooms || null,
        sq_ft: +form.sq_ft || null,
        year_built: +form.year_built || null,
        starting_price: +form.starting_price || null,
        asking_price: +form.asking_price || null,
        monthly_rate: +form.monthly_rate || null,
        reserve_price: +form.reserve_price || null,
      };
      await supabase.from('properties').insert(payload);
      setSuccess(true);
    } catch { alert('Failed to create listing. Try again.'); }
    setLoading(false);
  };

  if (success) return (
    <div className="h-dvh bg-navy-950 flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-5xl">🏡</div>
      <h2 className="text-white font-black text-xl">Listed!</h2>
      <p className="text-slate-400 text-center text-sm">Your property is live. Buyers can now bid or request showings.</p>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-amber-500 rounded-xl text-black font-bold">Back to Map</button>
    </div>
  );

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-700 bg-navy-900">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full bg-navy-800 text-slate-400"><ArrowLeft size={16} /></button>
        <h1 className="text-white font-black text-lg">List a Property</h1>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-navy-900 border-b border-navy-700">
        {MODES.map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`flex-1 py-2.5 text-xs font-semibold ${mode===m.key?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Address */}
        <section className="space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Property Address</p>
          <input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Street Address*"
            className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
          <div className="grid grid-cols-3 gap-2">
            <input value={form.city} onChange={e=>set('city',e.target.value)} placeholder="City*"
              className="col-span-1 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
            <input value={form.state} onChange={e=>set('state',e.target.value)} placeholder="State*"
              className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
            <input value={form.zip} onChange={e=>set('zip',e.target.value)} placeholder="ZIP"
              className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
          </div>
        </section>

        {/* Details */}
        <section className="space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Property Details</p>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.bedrooms} onChange={e=>set('bedrooms',e.target.value)} placeholder="Beds"
              className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            <input type="number" value={form.bathrooms} onChange={e=>set('bathrooms',e.target.value)} placeholder="Baths"
              className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            <input type="number" value={form.sq_ft} onChange={e=>set('sq_ft',e.target.value)} placeholder="Sq Ft"
              className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
          </div>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Description (optional)"
            className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none h-20 resize-none" />
        </section>

        {/* Mode-specific pricing */}
        <section className="space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pricing</p>
          {(mode === 'sale_auction' || mode === 'rent_auction') && (<>
            <input type="number" value={form.starting_price} onChange={e=>set('starting_price',e.target.value)} placeholder="Starting Price*"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
            <input type="number" value={form.reserve_price} onChange={e=>set('reserve_price',e.target.value)} placeholder="Reserve Price (optional)"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            <input type="datetime-local" value={form.auction_end_date} onChange={e=>set('auction_end_date',e.target.value)}
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
          </>)}
          {mode === 'sale_fixed' && (
            <input type="number" value={form.asking_price} onChange={e=>set('asking_price',e.target.value)} placeholder="Asking Price*"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
          )}
          {mode === 'rent_fixed' && (<>
            <input type="number" value={form.monthly_rate} onChange={e=>set('monthly_rate',e.target.value)} placeholder="Monthly Rent*"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
            <input type="text" value={form.lease_term} onChange={e=>set('lease_term',e.target.value)} placeholder="Lease Term (e.g. 12 months)"
              className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
          </>)}
        </section>

        {/* Contact */}
        <section className="space-y-2">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Your Contact Info</p>
          <input value={form.lister_name} onChange={e=>set('lister_name',e.target.value)} placeholder="Your Name"
            className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
          <input value={form.lister_email} onChange={e=>set('lister_email',e.target.value)} placeholder="Email"
            className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
          <input value={form.lister_phone} onChange={e=>set('lister_phone',e.target.value)} placeholder="Phone (optional)"
            className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
        </section>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3.5 bg-amber-500 rounded-xl text-black font-black text-base disabled:opacity-50">
          {loading ? 'Listing...' : '🏡 List Property'}
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
}
