import { cn } from '../utils';

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle boolean conditionals', () => {
        expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('should merge tailwind classes', () => {
        expect(cn('p-4 p-2')).toBe('p-2'); // tailwind-merge should keep last one
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
});
