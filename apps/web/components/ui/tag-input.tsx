import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
}

export function TagInput({ value, onChange, placeholder, suggestions = [] }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmed = inputValue.trim().replace(/,$/, '');
            if (trimmed && !value.includes(trimmed)) {
                onChange([...value, trimmed]);
            }
            setInputValue('');
            setShowSuggestions(false);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const addSuggestion = (suggestion: string) => {
        if (!value.includes(suggestion)) {
            onChange([...value, suggestion]);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
    );

    return (
        <div ref={containerRef} className="relative w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
            <div className="flex flex-wrap gap-1.5 items-center">
                {value.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded text-xs font-medium">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-violet-400 hover:text-white hover:bg-violet-500/50 rounded-full p-0.5 transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-md border border-slate-700 bg-slate-800 shadow-xl z-50">
                    <ul className="py-1">
                        {filteredSuggestions.map((suggestion, idx) => (
                            <li
                                key={idx}
                                onClick={() => addSuggestion(suggestion)}
                                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-violet-500/20 hover:text-white cursor-pointer transition-colors"
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
