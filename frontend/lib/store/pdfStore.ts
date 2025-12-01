import { create } from 'zustand';

interface PDF {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  pageCount?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface PDFState {
  pdfs: PDF[];
  currentPDF: PDF | null;
  setPDFs: (pdfs: PDF[]) => void;
  addPDF: (pdf: PDF) => void;
  updatePDF: (id: string, updates: Partial<PDF>) => void;
  removePDF: (id: string) => void;
  setCurrentPDF: (pdf: PDF | null) => void;
}

export const usePDFStore = create<PDFState>((set) => ({
  pdfs: [],
  currentPDF: null,
  setPDFs: (pdfs) => set({ pdfs }),
  addPDF: (pdf) => set((state) => ({ pdfs: [pdf, ...state.pdfs] })),
  updatePDF: (id, updates) =>
    set((state) => ({
      pdfs: state.pdfs.map((pdf) => (pdf.id === id ? { ...pdf, ...updates } : pdf)),
    })),
  removePDF: (id) => set((state) => ({ pdfs: state.pdfs.filter((pdf) => pdf.id !== id) })),
  setCurrentPDF: (pdf) => set({ currentPDF: pdf }),
}));
