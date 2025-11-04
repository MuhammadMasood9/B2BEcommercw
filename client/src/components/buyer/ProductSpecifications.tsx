import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  Ruler, 
  Weight, 
  Palette, 
  Zap, 
  Shield,
  Package,
  Settings
} from "lucide-react";

interface ProductSpecificationsProps {
  specifications: any;
}

export default function ProductSpecifications({ specifications }: ProductSpecificationsProps) {
  // Parse specifications
  const specs = specifications ? 
    (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : {};

  // Ensure we have a valid object
  const validSpecs = typeof specs === 'object' && specs !== null ? specs : {};

  // Group specifications by category
  const specCategories = {
    dimensions: ['width', 'height', 'depth', 'length', 'diameter', 'size', 'dimensions'],
    weight: ['weight', 'netWeight', 'grossWeight', 'mass'],
    material: ['material', 'materials', 'composition', 'fabric', 'construction'],
    color: ['color', 'colors', 'colour', 'finish', 'surface'],
    power: ['power', 'voltage', 'current', 'wattage', 'battery', 'energy'],
    performance: ['speed', 'capacity', 'efficiency', 'output', 'input', 'performance'],
    connectivity: ['connectivity', 'interface', 'ports', 'wireless', 'bluetooth', 'wifi'],
    certification: ['certification', 'certifications', 'standards', 'compliance', 'approval'],
    packaging: ['packaging', 'package', 'packing', 'carton', 'box'],
    other: []
  };

  // Categorize specifications
  const categorizedSpecs: { [key: string]: { [key: string]: any } } = {
    dimensions: {},
    weight: {},
    material: {},
    color: {},
    power: {},
    performance: {},
    connectivity: {},
    certification: {},
    packaging: {},
    other: {}
  };

  Object.entries(validSpecs).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    let categorized = false;

    for (const [category, keywords] of Object.entries(specCategories)) {
      if (keywords.some(keyword => lowerKey.includes(keyword))) {
        categorizedSpecs[category][key] = value;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categorizedSpecs.other[key] = value;
    }
  });

  // Category icons and labels
  const categoryConfig = {
    dimensions: { icon: Ruler, label: "Dimensions", color: "text-blue-600" },
    weight: { icon: Weight, label: "Weight", color: "text-green-600" },
    material: { icon: Layers, label: "Material", color: "text-purple-600" },
    color: { icon: Palette, label: "Color & Finish", color: "text-pink-600" },
    power: { icon: Zap, label: "Power & Energy", color: "text-yellow-600" },
    performance: { icon: Settings, label: "Performance", color: "text-red-600" },
    connectivity: { icon: Zap, label: "Connectivity", color: "text-indigo-600" },
    certification: { icon: Shield, label: "Certifications", color: "text-green-600" },
    packaging: { icon: Package, label: "Packaging", color: "text-gray-600" },
    other: { icon: Settings, label: "Other Specifications", color: "text-gray-600" }
  };

  // Format specification key for display
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Format specification value for display
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  // Check if category has specifications
  const hasSpecs = (category: string): boolean => {
    return Object.keys(categorizedSpecs[category]).length > 0;
  };

  // Get all non-empty categories
  const nonEmptyCategories = Object.keys(categorizedSpecs).filter(hasSpecs);

  if (nonEmptyCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Specifications Available</h3>
        <p className="text-gray-500">
          Detailed specifications for this product are not currently available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nonEmptyCategories.map(category => {
          const config = categoryConfig[category as keyof typeof categoryConfig];
          const Icon = config.icon;
          const specs = categorizedSpecs[category];

          return (
            <Card key={category} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <h4 className="font-semibold text-gray-900">{config.label}</h4>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-600 text-sm font-medium flex-1">
                        {formatKey(key)}:
                      </span>
                      <span className="text-gray-900 text-sm font-semibold text-right flex-1">
                        {formatValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Specification Summary</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(validSpecs).length}
              </div>
              <div className="text-sm text-gray-600">Total Specs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {nonEmptyCategories.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {hasSpecs('certification') ? Object.keys(categorizedSpecs.certification).length : 0}
              </div>
              <div className="text-sm text-gray-600">Certifications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {hasSpecs('material') ? Object.keys(categorizedSpecs.material).length : 0}
              </div>
              <div className="text-sm text-gray-600">Materials</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Specification Accuracy</h5>
            <p className="text-sm text-blue-700">
              All specifications are provided by the supplier and verified when possible. 
              For critical applications, please confirm specifications directly with the supplier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}