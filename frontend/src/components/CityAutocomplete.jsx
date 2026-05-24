import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

const CityAutocomplete = ({ value, onChange, onPlaceSelected, placeholder, className, required }) => {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        if (!isOpen) return;

        const fetchCities = async () => {
            let searchQuery = query.trim();
            if (!searchQuery || searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }
            
            // Basic typo tolerance for common Indian cities
            const typos = {
                'banglore': 'bangalore',
                'bengalooru': 'bengaluru',
                'mubmai': 'mumbai',
                'delh': 'delhi',
                'hydrabad': 'hyderabad',
                'chenai': 'chennai',
                'kolkatta': 'kolkata',
                'pune': 'pune'
            };
            
            const lowerQuery = searchQuery.toLowerCase();
            if (typos[lowerQuery]) {
                searchQuery = typos[lowerQuery];
            }

            setLoading(true);
            try {
                // Using a free geocoding API to mimic Google Maps Places without requiring a paid API Key
                const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
                const data = await response.json();
                
                if (data.results) {
                    const parsed = data.results.map(city => ({
                        name: city.name,
                        country: city.country,
                        admin1: city.admin1,
                        formatted: `${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}`
                    }));
                    setSuggestions(parsed);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchCities, 300);
        return () => clearTimeout(timeoutId);
    }, [query, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setQuery(e.target.value);
        setIsOpen(true);
        if (onChange) {
            onChange(e); // allow parent to control raw input
        }
    };

    const handleSelect = (city) => {
        setQuery(city.formatted);
        setIsOpen(false);
        if (onPlaceSelected) {
            onPlaceSelected({ name: city.name, formatted_address: city.formatted });
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={`outline-none bg-transparent ${className}`}
                required={required}
                autoComplete="off"
            />
            
            {isOpen && (query.length >= 2) && (
                <div className="absolute z-[9999] top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                            Searching Locations...
                        </div>
                    ) : suggestions.length > 0 ? (
                        <ul className="py-2">
                            {suggestions.map((city, idx) => (
                                <li 
                                    key={idx}
                                    onClick={() => handleSelect(city)}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-900">{city.name}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400">{city.admin1 ? `${city.admin1}, ` : ''}{city.country}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center text-sm font-bold text-slate-400 bg-slate-50">
                            No locations found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CityAutocomplete;
