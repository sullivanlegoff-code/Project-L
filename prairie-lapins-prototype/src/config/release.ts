export const RELEASE_LABEL = import.meta.env.MODE === 'decorations-preview' ? 'Aménagement · prévisualisation v7' : 'Prairie de lapins · île à neuf parcelles · v7';
export const BUILD_REVISION: string = import.meta.env.VITE_BUILD_REVISION?.trim() || 'local';
