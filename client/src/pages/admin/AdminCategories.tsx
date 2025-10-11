import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, type Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import type { z } from "zod";

export default function AdminCategories() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-categories-title">Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCategory(null)} data-testid="button-add-category">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <CategoryForm category={selectedCategory} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${category.id}`}>
                      {category.name}
                    </TableCell>
                    <TableCell data-testid={`text-slug-${category.id}`}>{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"} data-testid={`badge-status-${category.id}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedCategory(category); setIsDialogOpen(true); }} data-testid={`button-edit-${category.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm("Delete?") && deleteMutation.mutate(category.id)} data-testid={`button-delete-${category.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No categories found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryForm({ category, onSuccess }: { category: Category | null; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof insertCategorySchema>>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: category || { name: "", slug: "", isActive: true, displayOrder: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCategorySchema>) => {
      if (category) {
        return await apiRequest("PATCH", `/api/categories/${category.id}`, data);
      } else {
        return await apiRequest("POST", "/api/categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: category ? "Category updated" : "Category created" });
      onSuccess();
    },
  });

  const onSubmit = (data: z.infer<typeof insertCategorySchema>) => {
    if (!data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl><Input {...field} data-testid="input-category-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem>
            <FormLabel>Slug</FormLabel>
            <FormControl><Input {...field} value={field.value || ""} placeholder="auto-generated" data-testid="input-category-slug" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="isActive" render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl><Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-active" /></FormControl>
            <FormLabel className="!mt-0">Active</FormLabel>
          </FormItem>
        )} />

        <Button type="submit" disabled={mutation.isPending} data-testid="button-save-category">
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
