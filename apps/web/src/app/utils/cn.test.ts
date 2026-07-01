import { describe, it, expect } from 'vitest';
import { cn } from './cn';

// Test unitaire côté front (site web) : l'utilitaire de composition de classes
// utilisé par tous les composants UI. Vérifie la concaténation, l'ignorance
// des valeurs falsy et la résolution des conflits Tailwind (twMerge).
describe('cn — fusion de classes', () => {
  it('concatène les classes fournies', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('ignore les valeurs falsy (conditions non remplies)', () => {
    const show = false;
    expect(cn('a', show && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('résout les conflits Tailwind — la dernière classe gagne', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
