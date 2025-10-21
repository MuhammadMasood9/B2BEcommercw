import React, { useState } from "react";
import TagInput from "./TagInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TagInputDemo() {
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">TagInput Component Demo</h1>
        <p className="text-gray-600">Easy and comfortable tag management for admin forms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label="Colors"
              description="Enter product colors"
              placeholder="Type color name and press Enter"
              value={colors}
              onChange={setColors}
              maxTags={10}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current values:</p>
              <p className="text-sm text-gray-600">{JSON.stringify(colors)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label="Sizes"
              description="Enter product sizes"
              placeholder="Type size and press Enter"
              value={sizes}
              onChange={setSizes}
              maxTags={15}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current values:</p>
              <p className="text-sm text-gray-600">{JSON.stringify(sizes)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label="Features"
              description="Enter key product features"
              placeholder="Type feature and press Enter"
              value={features}
              onChange={setFeatures}
              maxTags={20}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current values:</p>
              <p className="text-sm text-gray-600">{JSON.stringify(features)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              label="Certifications"
              description="Enter product certifications"
              placeholder="Type certification and press Enter"
              value={certifications}
              onChange={setCertifications}
              maxTags={10}
            />
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current values:</p>
              <p className="text-sm text-gray-600">{JSON.stringify(certifications)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Features of TagInput Component</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Type and press Enter to add tags</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Paste comma-separated values to add multiple tags at once</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Click X on tags to remove them</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Press Backspace on empty input to remove last tag</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Set maximum number of tags</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Visual feedback and validation</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Responsive design and accessibility</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default TagInputDemo;
