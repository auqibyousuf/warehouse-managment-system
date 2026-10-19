import { nextDocumentNumber } from '../apiClient';

const year = new Date().getFullYear();

describe('nextDocumentNumber', () => {
  it('starts at 001 when nothing exists', () => {
    expect(nextDocumentNumber('INV', [])).toBe(`INV-${year}-001`);
  });

  it('continues from the highest number, not the list length', () => {
    const existing = [`INV-${year}-001`, `INV-${year}-005`];
    expect(nextDocumentNumber('INV', existing)).toBe(`INV-${year}-006`);
  });

  it('ignores other prefixes and other years', () => {
    const existing = [`REC-${year}-009`, `INV-${year - 1}-040`];
    expect(nextDocumentNumber('INV', existing)).toBe(`INV-${year}-001`);
  });
});
