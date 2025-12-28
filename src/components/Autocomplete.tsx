import { useState, useRef, useEffect } from 'react';

interface AutocompleteProps {
  options: number[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = '검색...',
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value?.toString() ?? '');
  const [filteredOptions, setFilteredOptions] = useState<number[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // value가 외부에서 변경되면 inputValue 동기화
  useEffect(() => {
    setInputValue(value?.toString() ?? '');
  }, [value]);

  // 옵션 필터링
  useEffect(() => {
    if (inputValue === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((opt) =>
        opt.toString().includes(inputValue)
      );
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue, options]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // 유효하지 않은 값이면 초기화
        if (inputValue && !options.includes(Number(inputValue))) {
          setInputValue(value?.toString() ?? '');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, options, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);

    // 정확히 매칭되는 값이 있으면 바로 선택
    const num = Number(val);
    if (!isNaN(num) && options.includes(num)) {
      onChange(num);
    }
  };

  const handleSelect = (option: number) => {
    setInputValue(option.toString());
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setInputValue(value?.toString() ?? '');
        break;
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input input-bordered input-sm w-full bg-white pr-8"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {inputValue && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                index === highlightedIndex
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              } ${option === value ? 'font-bold' : ''}`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}점
            </li>
          ))}
        </ul>
      )}

      {isOpen && filteredOptions.length === 0 && inputValue && (
        <div className="absolute z-[100] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-gray-500 text-sm">
          일치하는 점수가 없습니다
        </div>
      )}
    </div>
  );
}
