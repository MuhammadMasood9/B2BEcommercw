import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  FileText, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Flag,
  Clock,
  Zap,
  Eye,
  Copy,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

// ==================== INTERFACES ====================

interface ContentAnalysisResult {
  id: string;
  contentId: string;
  contentType: 'product' | 'description' | 'image' | 'title';
  analysisType: 'text' | 'image' | 'policy' | 'duplicate';
  score: number;
  flags: ContentFlag[];
  recommendations: string[];
  confidence: number;
  processingTime: number;
  createdAt: Date;
}

interface ContentFlag {
  type: 'inappropriate' | 'spam' | 'policy_violation' | 'quality_issue' | 'duplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  suggestedAction: 'approve' | 'review' | 'reject' | 'edit';
}

interface ImageAnalysisResult {
  imageUrl: string;
  qualityScore: number;
  appropriatenessScore: number;
  flags: ImageFlag[];
  metadata: ImageMetadata;
  recommendations: string[];
}

interface ImageFlag {
  type: 'low_quality' | 'inappropriate' | 'watermark' | 'text_heavy' | 'blurry';
  confidence: number;
  description: string;
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  hasWatermark: boolean;
  textDetected: boolean;
  dominantColors: string[];
}

interface DuplicateDetectionResult {
  isDuplicate: boolean;
  duplicateOf?: string[];
  similarity: number;
  duplicateType: 'exact' | 'near_duplicate' | 'similar';
  matchedFields: string[];
}

interface ContentAnalyzerProps {
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export default function ContentAnalyzer({ className }: ContentAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Text Analysis State
  const [textContent, setTextContent] = useState('');
  const [textContentType, setTextContentType] = useState('description');
  const [textAnalysisResult, setTextAnalysisResult] = useState<ContentAnalysisResult | null>(null);
  
  // Image Analysis State
  const [imageUrl, setImageUrl] = useState('');
  const [imageAnalysisResult, setImageAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  
  // Duplicate Detection State
  const [duplicateContent, setDuplicateContent] = useState('');
  const [duplicateContentType, setDuplicateContentType] = useState('product');
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  
  // Automated Screening State
  const [productId, setProductId] = useState('');
  const [screeningResult, setScreeningResult] = useState<any>(null);
  
  // ==================== ANALYSIS FUNCTIONS ====================
  
  const analyzeTextContent = async () => {
    if (!textContent.trim()) return;
    
    try {
      setAnalyzing(true);
      
      const response = await fetch('/api/admin/moderation/analyze/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
          contentType: textContentType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTextAnalysisResult(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing text content:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const analyzeImageContent = async () => {
    if (!imageUrl.trim()) return;
    
    try {
      setAnalyzing(true);
      
      const response = await fetch('/api/admin/moderation/analyze/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImageAnalysisResult(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing image content:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const detectDuplicates = async () => {
    if (!duplicateContent.trim()) return;
    
    try {
      setAnalyzing(true);
      
      const response = await fetch('/api/admin/moderation/detect-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: duplicateContent,
          contentType: duplicateContentType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDuplicateResult(data.duplicateCheck);
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const runAutomatedScreening = async () => {
    if (!productId.trim()) return;
    
    try {
      setAnalyzing(true);
      
      const response = await fetch('/api/admin/moderation/automated-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScreeningResult(data.screening);
      }
    } catch (error) {
      console.error('Error running automated screening:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  // ==================== UTILITY FUNCTIONS ====================
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // ==================== RENDER ====================
  
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Content Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Analysis
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Analysis
              </TabsTrigger>
              <TabsTrigger value="duplicate" className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Duplicate Detection
              </TabsTrigger>
              <TabsTrigger value="screening" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Automated Screening
              </TabsTrigger>
            </TabsList>
            
            {/* Text Analysis Tab */}
            <TabsContent value="text" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Content Type</label>
                    <Select value={textContentType} onValueChange={setTextContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Product Title</SelectItem>
                        <SelectItem value="description">Product Description</SelectItem>
                        <SelectItem value="product">General Product Content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Content to Analyze</label>
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter the text content you want to analyze..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={analyzeTextContent}
                    disabled={analyzing || !textContent.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Analyze Text Content
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Results Section */}
                <div className="space-y-4">
                  {textAnalysisResult ? (
                    <>
                      {/* Score Overview */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Content Quality Score</span>
                            <span className={`text-2xl font-bold ${getScoreColor(textAnalysisResult.score)}`}>
                              {textAnalysisResult.score}/100
                            </span>
                          </div>
                          <Progress 
                            value={textAnalysisResult.score} 
                            className="h-2"
                          />
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Confidence: {Math.round(textAnalysisResult.confidence * 100)}%</span>
                            <span>Processing: {textAnalysisResult.processingTime}ms</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Flags */}
                      {textAnalysisResult.flags.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              Content Flags ({textAnalysisResult.flags.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {textAnalysisResult.flags.map((flag, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={getSeverityColor(flag.severity)}>
                                    {flag.type.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(flag.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">{flag.description}</p>
                                <p className="text-xs text-gray-500">
                                  Suggested action: <span className="font-medium">{flag.suggestedAction}</span>
                                </p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Recommendations */}
                      {textAnalysisResult.recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {textAnalysisResult.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Enter text content and click "Analyze" to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Image Analysis Tab */}
            <TabsContent value="image" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL</label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                    />
                  </div>
                  
                  {imageUrl && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Preview</label>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="max-w-full h-48 object-contain mx-auto rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={analyzeImageContent}
                    disabled={analyzing || !imageUrl.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Results Section */}
                <div className="space-y-4">
                  {imageAnalysisResult ? (
                    <>
                      {/* Score Overview */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-600 mb-1">Quality Score</p>
                              <p className={`text-2xl font-bold ${getScoreColor(imageAnalysisResult.qualityScore)}`}>
                                {imageAnalysisResult.qualityScore}/100
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-600 mb-1">Appropriateness</p>
                              <p className={`text-2xl font-bold ${getScoreColor(imageAnalysisResult.appropriatenessScore)}`}>
                                {imageAnalysisResult.appropriatenessScore}/100
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Image Metadata */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Image Metadata</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Dimensions:</strong> {imageAnalysisResult.metadata.width} × {imageAnalysisResult.metadata.height}</p>
                              <p><strong>Format:</strong> {imageAnalysisResult.metadata.format}</p>
                              <p><strong>File Size:</strong> {formatFileSize(imageAnalysisResult.metadata.fileSize)}</p>
                            </div>
                            <div>
                              <p><strong>Has Watermark:</strong> {imageAnalysisResult.metadata.hasWatermark ? 'Yes' : 'No'}</p>
                              <p><strong>Text Detected:</strong> {imageAnalysisResult.metadata.textDetected ? 'Yes' : 'No'}</p>
                              <p><strong>Dominant Colors:</strong> 
                                <div className="flex gap-1 mt-1">
                                  {imageAnalysisResult.metadata.dominantColors.map((color, index) => (
                                    <div
                                      key={index}
                                      className="w-4 h-4 rounded border"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Image Flags */}
                      {imageAnalysisResult.flags.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              Image Issues ({imageAnalysisResult.flags.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {imageAnalysisResult.flags.map((flag, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                    {flag.type.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(flag.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{flag.description}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Recommendations */}
                      {imageAnalysisResult.recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {imageAnalysisResult.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Enter an image URL and click "Analyze" to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Duplicate Detection Tab */}
            <TabsContent value="duplicate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Content Type</label>
                    <Select value={duplicateContentType} onValueChange={setDuplicateContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product Content</SelectItem>
                        <SelectItem value="title">Product Title</SelectItem>
                        <SelectItem value="description">Product Description</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Content to Check</label>
                    <Textarea
                      value={duplicateContent}
                      onChange={(e) => setDuplicateContent(e.target.value)}
                      placeholder="Enter the content you want to check for duplicates..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                  
                  <Button 
                    onClick={detectDuplicates}
                    disabled={analyzing || !duplicateContent.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Check for Duplicates
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Results Section */}
                <div className="space-y-4">
                  {duplicateResult ? (
                    <>
                      {/* Duplicate Status */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            {duplicateResult.isDuplicate ? (
                              <>
                                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                <p className="text-lg font-semibold text-red-600">Duplicate Detected</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {Math.round(duplicateResult.similarity * 100)}% similarity
                                </p>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                <p className="text-lg font-semibold text-green-600">No Duplicates Found</p>
                                <p className="text-sm text-gray-600 mt-1">Content appears to be unique</p>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Duplicate Details */}
                      {duplicateResult.isDuplicate && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Duplicate Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><strong>Duplicate Type:</strong> {duplicateResult.duplicateType.replace('_', ' ')}</p>
                                <p><strong>Similarity:</strong> {Math.round(duplicateResult.similarity * 100)}%</p>
                              </div>
                              <div>
                                <p><strong>Matched Fields:</strong> {duplicateResult.matchedFields.join(', ')}</p>
                                <p><strong>Duplicate Count:</strong> {duplicateResult.duplicateOf?.length || 0}</p>
                              </div>
                            </div>
                            
                            {duplicateResult.duplicateOf && duplicateResult.duplicateOf.length > 0 && (
                              <div>
                                <p className="font-medium mb-2">Similar Content IDs:</p>
                                <div className="flex flex-wrap gap-2">
                                  {duplicateResult.duplicateOf.map((id, index) => (
                                    <Badge key={index} variant="outline">
                                      {id}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Copy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Enter content and click "Check for Duplicates" to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Automated Screening Tab */}
            <TabsContent value="screening" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product ID</label>
                    <Input
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="Enter product ID to screen..."
                    />
                  </div>
                  
                  <Button 
                    onClick={runAutomatedScreening}
                    disabled={analyzing || !productId.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Screening...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Run Automated Screening
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Results Section */}
                <div className="space-y-4">
                  {screeningResult ? (
                    <>
                      {/* Overall Score */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Score</span>
                            <span className={`text-2xl font-bold ${getScoreColor(screeningResult.overallScore)}`}>
                              {screeningResult.overallScore}/100
                            </span>
                          </div>
                          <Progress value={screeningResult.overallScore} className="h-2" />
                          <div className="mt-2 text-center">
                            <Badge className={
                              screeningResult.recommendation === 'approve' ? 'bg-green-100 text-green-800' :
                              screeningResult.recommendation === 'review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              Recommendation: {screeningResult.recommendation}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Analysis Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Analysis Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Text Analyses:</strong> {screeningResult.textAnalysis?.length || 0}</p>
                              <p><strong>Image Analyses:</strong> {screeningResult.imageAnalysis?.length || 0}</p>
                            </div>
                            <div>
                              <p><strong>Total Flags:</strong> {screeningResult.flags?.length || 0}</p>
                              <p><strong>Has Duplicates:</strong> {screeningResult.duplicateCheck?.isDuplicate ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Flags Summary */}
                      {screeningResult.flags && screeningResult.flags.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              Screening Flags ({screeningResult.flags.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {screeningResult.flags.slice(0, 5).map((flag: ContentFlag, index: number) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className={getSeverityColor(flag.severity)}>
                                    {flag.type.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(flag.confidence * 100)}% confidence
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{flag.description}</p>
                              </div>
                            ))}
                            {screeningResult.flags.length > 5 && (
                              <p className="text-sm text-gray-500 text-center">
                                ... and {screeningResult.flags.length - 5} more flags
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Enter a product ID and click "Run Automated Screening" to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}