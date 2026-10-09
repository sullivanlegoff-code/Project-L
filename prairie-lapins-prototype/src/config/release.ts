export const RELEASE_LABEL = import.meta.env.MODE === 'decorations-preview' ? 'Aménagement · prévisualisation v5' : 'Prairie de lapins · quinze espèces · v5';
export const BUILD_REVISION: string = import.meta.env.VITE_BUILD_REVISION?.trim() || 'local';
