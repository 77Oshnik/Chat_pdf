'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { usePDFStore } from '@/lib/store/pdfStore';
import { pdfService } from '@/lib/services/pdfService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Upload, LogOut, Loader2, CheckCircle, XCircle, Clock, MoreVertical, Trash2, RefreshCw, Eye } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { pdfs, setPDFs, addPDF, removePDF, updatePDF } = usePDFStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadPDFs();
  }, [isAuthenticated, router]);

  const loadPDFs = async () => {
    try {
      const response = await pdfService.getAll();
      setPDFs(response.data.pdfs);
    } catch (error) {
      toast.error('Failed to load PDFs');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await pdfService.upload(file);
      addPDF(response.data.pdf);
      toast.success('PDF uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDelete = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) {
      return;
    }

    setDeletingId(pdfId);
    try {
      await pdfService.delete(pdfId);
      removePDF(pdfId);
      toast.success('PDF deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete PDF');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (pdfId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setRetryingId(pdfId);
    try {
      const response = await pdfService.retry(pdfId);
      
      // Update the PDF in the store
      updatePDF(pdfId, { 
        processingStatus: 'pending', 
        embeddingStatus: 'pending' 
      });

      toast.success('PDF queued for reprocessing');
      
      // Reload PDFs after a short delay to get updated status
      setTimeout(() => loadPDFs(), 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retry processing');
    } finally {
      setRetryingId(null);
    }
  };

  const handleViewPDF = (pdf: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (pdf.cloudinaryUrl) {
      // Open PDF in new tab
      window.open(pdf.cloudinaryUrl, '_blank');
      toast.success('Opening PDF in new tab');
    } else {
      toast.error('PDF URL not available');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">RAG PDF Chat</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total PDFs</CardDescription>
              <CardTitle className="text-3xl">{pdfs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ready to Chat</CardDescription>
              <CardTitle className="text-3xl">
                {pdfs.filter((p) => p.processingStatus === 'completed').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Processing</CardDescription>
              <CardTitle className="text-3xl">
                {pdfs.filter((p) => p.processingStatus === 'processing' || p.processingStatus === 'pending').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
            <CardDescription>Upload a PDF document to start chatting with it</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <p className="text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">{isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF here'}</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse (max 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Your Documents</h2>
          {pdfs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No PDFs uploaded yet. Upload your first document to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfs.map((pdf) => {
                const pdfId = pdf.id;
                const canDelete = pdf.processingStatus === 'completed' || pdf.processingStatus === 'failed';
                const canRetry = pdf.processingStatus === 'failed';
                
                return (
                  <Card
                    key={pdfId}
                    className="hover:shadow-md transition-shadow relative"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-8 w-8 text-primary" />
                          {getStatusIcon(pdf.processingStatus)}
                        </div>
                        
                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => handleViewPDF(pdf, e)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canRetry && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => handleRetry(pdfId, e)}
                                  disabled={retryingId === pdfId}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  {retryingId === pdfId ? 'Retrying...' : 'Retry Processing'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={(e) => handleDelete(pdfId, e)}
                                disabled={deletingId === pdfId}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingId === pdfId ? 'Deleting...' : 'Delete PDF'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg line-clamp-1">{pdf.filename}</CardTitle>
                      <CardDescription>
                        {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                        {pdf.pageCount && ` • ${pdf.pageCount} pages`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{new Date(pdf.createdAt).toLocaleDateString()}</span>
                        {pdf.processingStatus === 'completed' ? (
                          <Button 
                            size="sm"
                            onClick={() => router.push(`/chat/${pdfId}`)}
                          >
                            Chat Now
                          </Button>
                        ) : pdf.processingStatus === 'failed' ? (
                          <span className="text-xs text-red-600 font-medium">
                            Failed
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {pdf.processingStatus === 'processing' ? 'Processing...' : 'Pending...'}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
