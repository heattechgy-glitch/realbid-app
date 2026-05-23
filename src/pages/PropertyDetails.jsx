import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize2, MapPin, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

function formatPrice(n) { return '$' + Number(n || 0).toLocaleString(); }
function getTimeRemaining(end) {
  if (!end) return '';
  const ms = new Date(end) - Date.now();
  if (ms < 0) return 'Ended';
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h/24)}d left`;
  return `${h}h ${m}m left`;
}

const BADGES = {
  sale_auction: { label: 'Auction', color: 'bg-amber-500 text-black' },
  sale_fixed: { label: 'For Sale', color: 'bg-blue-500 text-white' },
  rent_auction: { label: 'Rent Bid', color: 'bg-purple-500 text-white' },
  rent_fixed: { label: 'For Rent', color: 'bg-green-500 text-white' },
};

export default function PropertyDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [showingForm, setShowingForm] = useState(false);
  const [showing, setShowing] = useState({ date: '', time: '', notes: '' });
  const [showingSuccess, setShowingSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [tab, setTab] = useState('details');

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('*').eq('id', id).single(),
      supabase.from('bids').select('*').eq('property_id', id).order('amount', { ascending: false }),
    ]).then(([{ data: prop }, { data: b }]) => {
      setProperty(prop);
      setBids(b || []);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!property?.auction_end_date) return;
    const t = setInterval(() => setTimeLeft(getTimeRemaining(property.auction_end_date)), 30000);
    setTimeLeft(getTimeRemaining(property.auction_end_date));
    return () => clearInterval(t);
  }, [property?.auction_end_date]);

  const isAuction = property?.listing_type === 'sale_auction' || property?.listing_type === 'rent_auction';

  const handleBid = async () => {
    if (!user) { alert('Please sign in to bid.'); return; }
    const minBid = (property.current_bid || property.starting_price || 0) + 1;
    if (!bidAmount || +bidAmount < minBid) { alert(`Min bid: ${formatPrice(minBid)}`); return; }
    setBidLoading(true);
    try {
      await supabase.from('bids').insert({
        property_id: id, bidder_id: user.id, bidder_name: user.full_name,
        bidder_email: user.email, amount: +bidAmount, status: 'active',
        earnest_paid: false, earnest_amount: Math.round(+bidAmount * 0.01),
      });
      await supabase.from('properties').update({ current_bid: +bidAmount, bid_count: (property.bid_count || 0) + 1 }).eq('id', id);
      if (bids.length > 0 && bids[0].bidder_id !== user.id) {
        await supabase.from('bids').update({ status: 'outbid' }).eq('id', bids[0].id);
        await supabase.from('notifications').insert({ user_id: bids[0].bidder_id, type: 'outbid', message: `You've been outbid on ${property.address}. New bid: ${formatPrice(+bidAmount)}`, property_id: id, is_read: false });
      }
      setBidSuccess(true); setBidAmount('');
      const [{ data: updProp }, { data: updBids }] = await Promise.all([
        supabase.from('properties').select('*').eq('id', id).single(),
        supabase.from('bids').select('*').eq('property_id', id).order('amount', { ascending: false }),
      ]);
      setProperty(updProp); setBids(updBids || []);
    } catch { alert('Failed to place bid. Try again.'); }
    setBidLoading(false);
  };

  const handleShowing = async () => {
    if (!user) { alert('Please sign in.'); return; }
    try {
      await supabase.from('showings').insert({
        property_id: id, buyer_id: user.id, buyer_name: user.full_name,
        buyer_email: user.email, seller_email: property.lister_email,
        requested_date: showing.date, requested_time: showing.time,
        notes: showing.notes, status: 'pending',
      });
      setShowingSuccess(true); setShowingForm(false);
    } catch { alert('Failed to request showing.'); }
  };

  if (loading) return <div className="h-dvh bg-navy-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!property) return <div className="h-dvh bg-navy-950 flex items-center justify-center text-slate-400">Not found.</div>;

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'];
  const badge = BADGES[property.listing_type] || { label: 'Listing', color: 'bg-slate-500 text-white' };

  return (
    <div className="h-dvh bg-navy-950 flex flex-col overflow-hidden">
      {/* Gallery */}
      <div className="relative flex-shrink-0" style={{ height: '40dvh' }}>
        <img src={images[imgIdx]} alt={property.address} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"><ArrowLeft size={18} /></button>
        {images.length > 1 && (<>
          <button onClick={() => setImgIdx(i => Math.max(0, i-1))} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 rounded-full text-white"><ChevronLeft size={16} /></button>
          <button onClick={() => setImgIdx(i => Math.min(images.length-1, i+1))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 rounded-full text-white"><ChevronRight size={16} /></button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===imgIdx?'bg-white':'bg-white/40'}`} />)}
          </div>
        </>)}
        <div className="absolute bottom-3 left-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-700 bg-navy-900">
        {['details','bids','showing'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${tab===t?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'details' && (<>
          <div>
            <h1 className="text-white font-black text-xl">{property.address}</h1>
            <p className="text-slate-400 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12} />{property.city}, {property.state} {property.zip}</p>
            <div className="flex gap-4 mt-2 text-slate-300 text-sm">
              {property.bedrooms && <span className="flex items-center gap-1"><Bed size={14} />{property.bedrooms} bd</span>}
              {property.bathrooms && <span className="flex items-center gap-1"><Bath size={14} />{property.bathrooms} ba</span>}
              {property.sq_ft && <span className="flex items-center gap-1"><Maximize2 size={14} />{property.sq_ft?.toLocaleString()} sqft</span>}
            </div>
          </div>
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4">
            {isAuction ? (<>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-400 text-xs">Current Bid</p>
                  <p className="text-amber-400 font-black text-2xl">{formatPrice(property.current_bid || property.starting_price)}</p>
                  <p className="text-slate-500 text-xs">{property.bid_count||0} bids • started at {formatPrice(property.starting_price)}</p>
                </div>
                {timeLeft && <div className="text-right"><p className="text-slate-400 text-xs">Ends</p><p className="text-white text-sm font-bold">{timeLeft}</p></div>}
              </div>
              {property.reserve_met && <p className="text-green-400 text-xs font-semibold mb-2">✅ Reserve met</p>}
              {bidSuccess ? (
                <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 text-center">
                  <p className="text-green-400 font-bold text-sm">✅ Bid placed! Pay 1% earnest money ({formatPrice(property.current_bid*0.01)}) to secure.</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="number" value={bidAmount} onChange={e=>setBidAmount(e.target.value)}
                    placeholder={`Min: ${formatPrice((property.current_bid||property.starting_price||0)+1)}`}
                    className="flex-1 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400" />
                  <button onClick={handleBid} disabled={bidLoading}
                    className="px-4 py-2.5 bg-amber-500 rounded-xl text-black font-bold text-sm disabled:opacity-50">
                    {bidLoading ? '...' : 'Bid'}
                  </button>
                </div>
              )}
            </>) : (
              <div>
                <p className="text-slate-400 text-xs">{property.listing_type==='rent_fixed'?'Monthly Rent':'Asking Price'}</p>
                <p className="text-amber-400 font-black text-2xl">{formatPrice(property.asking_price || property.monthly_rate)}</p>
              </div>
            )}
          </div>
          <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-amber-400" /><p className="text-white text-sm font-semibold">Escrow Protection</p></div>
            <p className="text-slate-400 text-xs">All bids require 1% earnest money held in escrow. Funds are released only upon mutual agreement.</p>
          </div>
          {property.description && <div className="bg-navy-900 border border-navy-700 rounded-2xl p-4"><p className="text-slate-300 text-sm">{property.description}</p></div>}
        </>)}

        {tab === 'bids' && (<>
          <h3 className="text-white font-bold">Bid History ({bids.length})</h3>
          {bids.length===0 && <p className="text-slate-400 text-sm">No bids yet. Be the first!</p>}
          {bids.map((b,i) => (
            <div key={b.id} className={`flex justify-between items-center p-3 rounded-xl border ${i===0?'border-amber-500 bg-amber-950/30':'border-navy-700 bg-navy-900'}`}>
              <div>
                <p className="text-white text-sm font-semibold">{b.bidder_name || 'Anonymous'}</p>
                <p className="text-slate-400 text-xs">{b.status} {b.earnest_paid?'• earnest paid':''}</p>
              </div>
              <p className={`font-black text-lg ${i===0?'text-amber-400':'text-slate-300'}`}>{formatPrice(b.amount)}</p>
            </div>
          ))}
        </>)}

        {tab === 'showing' && (<>
          <h3 className="text-white font-bold">Request a Showing</h3>
          {showingSuccess ? (
            <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
              <p className="text-green-400 font-bold">✅ Showing requested! The seller will confirm.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input type="date" value={showing.date} onChange={e=>setShowing(s=>({...s,date:e.target.value}))}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
              <input type="time" value={showing.time} onChange={e=>setShowing(s=>({...s,time:e.target.value}))}
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
              <textarea value={showing.notes} onChange={e=>setShowing(s=>({...s,notes:e.target.value}))}
                placeholder="Any notes for the seller..."
                className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none h-20 resize-none" />
              <button onClick={handleShowing} className="w-full py-3 bg-amber-500 rounded-xl text-black font-bold">Request Showing</button>
            </div>
          )}
          <div className="text-center">
            <p className="text-slate-400 text-xs">Listed by {property.lister_name || 'Owner'}</p>
            {property.lister_phone && <p className="text-slate-400 text-xs">{property.lister_phone}</p>}
          </div>
        </>)}
      </div>
    </div>
  );
}
