import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Bed, Bath, Maximize2, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const LISTING_BADGES = {
  sale_auction: { label: 'Auction', color: 'bg-amber-500 text-black' },
  sale_fixed: { label: 'For Sale', color: 'bg-blue-500 text-white' },
  rent_auction: { label: 'Rent Bid', color: 'bg-purple-500 text-white' },
  rent_fixed: { label: 'For Rent', color: 'bg-green-500 text-white' },
};

function getUrgency(endDate) {
  if (!endDate) return null;
  const ms = new Date(endDate) - Date.now();
  if (ms < 0) return 'expired';
  if (ms < 86400000) return 'critical';
  if (ms < 604800000) return 'urgent';
  return null;
}

function formatPrice(n) {
  if (!n) return '$0';
  return '$' + Number(n).toLocaleString();
}

export default function Home() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [properties, setProperties] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    supabase.from('properties').select('*').eq('status', 'active').then(({ data }) => {
      setProperties(data || []);
      setFiltered(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
    });
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    // Add markers
    properties.forEach(p => {
      if (!p.lat || !p.lng) return;
      const urgency = getUrgency(p.auction_end_date);
      const el = document.createElement('div');
      el.className = 'cursor-pointer text-lg';
      el.innerHTML = urgency === 'critical' ? '🔴' : urgency === 'urgent' ? '⭐' : '📍';
      el.addEventListener('click', () => {
        setSelectedId(p.id);
        const card = document.getElementById(`card-${p.id}`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(mapInstance.current);
    });
  }, [properties]);

  useEffect(() => {
    let result = properties;
    if (search) result = result.filter(p =>
      p.address?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase())
    );
    if (listingType !== 'all') result = result.filter(p => p.listing_type === listingType);
    setFiltered(result);
  }, [search, listingType, properties]);

  return (
    <div className="h-dvh flex flex-col bg-navy-950 overflow-hidden">
      {/* Map */}
      <div ref={mapRef} style={{ height: '50dvh', flexShrink: 0 }} />

      {/* Search bar */}
      <div className="bg-navy-900 border-b border-navy-700 px-3 py-2 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-navy-800 rounded-xl px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search city or address..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
          />
        </div>
        <button onClick={() => setShowFilters(f => !f)} className="p-2 bg-navy-800 rounded-xl text-slate-400">
          <SlidersHorizontal size={16} />
        </button>
        <button onClick={() => navigate('/list')} className="px-3 py-2 bg-amber-500 rounded-xl text-black text-xs font-bold">
          + List
        </button>
      </div>

      {/* Filter pills */}
      {showFilters && (
        <div className="bg-navy-900 px-3 pb-2 flex gap-2 overflow-x-auto">
          {[['all','All'], ['sale_auction','Auction'], ['sale_fixed','For Sale'], ['rent_auction','Rent Bid'], ['rent_fixed','For Rent']].map(([v, l]) => (
            <button key={v} onClick={() => setListingType(v)}
              className={`whitespace-nowrap text-xs px-3 py-1 rounded-full font-semibold ${listingType === v ? 'bg-amber-500 text-black' : 'bg-navy-700 text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Property cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && <div className="text-center text-slate-400 py-8">Loading...</div>}
        {!loading && filtered.length === 0 && <div className="text-center text-slate-400 py-8">No properties found.</div>}
        {filtered.map(p => {
          const badge = LISTING_BADGES[p.listing_type] || { label: 'Listing', color: 'bg-slate-500 text-white' };
          const urgency = getUrgency(p.auction_end_date);
          const isSelected = selectedId === p.id;
          return (
            <div id={`card-${p.id}`} key={p.id}
              onClick={() => navigate(`/property/${p.id}`)}
              className={`bg-navy-900 rounded-2xl overflow-hidden border cursor-pointer transition-all ${isSelected ? 'border-amber-400' : 'border-navy-700'}`}>
              <div className="relative h-40">
                <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400'} alt={p.address} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                  {urgency === 'critical' && <span className="text-[10px] font-bold text-red-400">🔴 &lt;24h</span>}
                  {urgency === 'urgent' && <span className="text-[10px] font-bold text-amber-400">⭐ &lt;7d</span>}
                </div>
              </div>
              <div className="p-3">
                <p className="text-white font-bold text-sm">{p.address}</p>
                <p className="text-slate-400 text-xs">{p.city}, {p.state}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-amber-400 font-black text-lg">{formatPrice(p.current_bid || p.starting_price || p.asking_price)}</p>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    {p.bedrooms && <span className="flex items-center gap-0.5"><Bed size={11} />{p.bedrooms}</span>}
                    {p.bathrooms && <span className="flex items-center gap-0.5"><Bath size={11} />{p.bathrooms}</span>}
                    {p.sq_ft && <span className="flex items-center gap-0.5"><Maximize2 size={11} />{p.sq_ft?.toLocaleString()}</span>}
                  </div>
                </div>
                {p.bid_count > 0 && <p className="text-slate-500 text-xs mt-1">{p.bid_count} bids</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
