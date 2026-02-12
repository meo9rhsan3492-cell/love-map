import { Input } from '@/app/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜索回忆...' }: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={`
      relative transition-all duration-300
      ${isFocused ? 'ring-2 ring-pink-400 ring-opacity-50' : ''}
      rounded-lg
    `}>
            <div className="relative">
                <Search className={`
          absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
          ${isFocused || value ? 'text-pink-500' : 'text-gray-400'}
        `} />
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="pl-10 pr-10 h-11 border-gray-200 focus:border-pink-300"
                />
                <AnimatePresence>
                    {value && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-pink-100"
                                onClick={() => onChange('')}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
