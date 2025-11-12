import React, { useState } from "react";
import KeyValueInput from "./KeyValueInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function KeyValueInputDemo() {
  const [specifications, setSpecifications] = useState<Record<string, string>>({
    "Power": "100W",
    "Voltage": "AC 85-265V",
    "Frequency": "50/60Hz",
    "Material": "Stainless Steel",
    "Weight": "2.5kg"
  });

  const [productSpecs, setProductSpecs] = useState<Record<string, string>>({});

  const handleReset = () => {
    setSpecifications({});
    setProductSpecs({});
  };

  const handleLoadSample = () => {
    setSpecifications({
      "Power": "100W",
      "Voltage": "AC 85-265V",
      "Frequency": "50/60Hz",
      "Material": "Stainless Steel",
      "Weight": "2.5kg",
      "Dimensions": "300x200x150mm",
      "Operating Temperature": "-10°C to +60°C",
      "Certification": "CE, RoHS, FCC"
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">KeyValueInput Component Demo</h1>
        <p className="text-gray-600">Easy key-value pair management for product specifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValueInput
              label="Technical Specifications"
              description="Enter product technical specifications as key-value pairs"
              value={specifications}
              onChange={setSpecifications}
              maxPairs={15}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current JSON data:</p>
              <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                {JSON.stringify(specifications, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empty Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <KeyValueInput
              label="New Product Specs"
              description="Start adding specifications for a new product"
              value={productSpecs}
              onChange={setProductSpecs}
              maxPairs={10}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current JSON data:</p>
              <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                {JSON.stringify(productSpecs, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features of KeyValueInput Component</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Easy Input Methods</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Type key and value, press Enter to add</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Paste JSON format to auto-populate</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Paste key:value format (one per line)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Edit existing pairs inline</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">User Experience</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Visual key and value icons</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Prevent duplicate keys</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Easy removal with X button</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Maximum pairs limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span>Responsive design</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-primary rounded-lg">
            <h4 className="font-semibold mb-2">Sample Data Formats</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">JSON Format:</p>
                <pre className="bg-white p-2 rounded border text-xs">
{`{
  "Power": "100W",
  "Voltage": "AC 85-265V",
  "Material": "Stainless Steel"
}`}
                </pre>
              </div>
              <div>
                <p className="font-medium mb-1">Key:Value Format:</p>
                <pre className="bg-white p-2 rounded border text-xs">
{`Power: 100W
Voltage: AC 85-265V
Material: Stainless Steel`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={handleLoadSample} variant="outline">
          Load Sample Data
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset All
        </Button>
      </div>
    </div>
  );
}

export default KeyValueInputDemo;
