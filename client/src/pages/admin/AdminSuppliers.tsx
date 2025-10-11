import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema, type Supplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import type { z } from "zod";

export default function AdminSuppliers() {
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Success", description: "Supplier deleted successfully" });
    },
  });

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-suppliers-title">Suppliers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSupplier(null)} data-testid="button-add-supplier">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            </DialogHeader>
            <SupplierForm supplier={selectedSupplier} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search suppliers..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-suppliers" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${supplier.id}`}>
                      {supplier.name}
                    </TableCell>
                    <TableCell data-testid={`text-email-${supplier.id}`}>{supplier.email}</TableCell>
                    <TableCell data-testid={`text-country-${supplier.id}`}>{supplier.country || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.isVerified ? "default" : "secondary"} data-testid={`badge-verified-${supplier.id}`}>
                        {supplier.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-orders-${supplier.id}`}>{supplier.totalOrders}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedSupplier(supplier); setIsDialogOpen(true); }} data-testid={`button-edit-${supplier.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm("Delete?") && deleteMutation.mutate(supplier.id)} data-testid={`button-delete-${supplier.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No suppliers found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupplierForm({ supplier, onSuccess }: { supplier: Supplier | null; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof insertSupplierSchema>>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: supplier || { name: "", email: "", isVerified: false, totalOrders: 0 },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertSupplierSchema>) => {
      if (supplier) {
        return await apiRequest("PATCH", `/api/suppliers/${supplier.id}`, data);
      } else {
        return await apiRequest("POST", "/api/suppliers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Success", description: supplier ? "Supplier updated" : "Supplier created" });
      onSuccess();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl><Input {...field} data-testid="input-supplier-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl><Input {...field} type="email" data-testid="input-email" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-phone" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-country" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-city" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="website" render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl><Input {...field} value={field.value || ""} placeholder="https://" data-testid="input-website" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="isVerified" render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl><Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-verified" /></FormControl>
            <FormLabel className="!mt-0">Verified</FormLabel>
          </FormItem>
        )} />

        <Button type="submit" disabled={mutation.isPending} data-testid="button-save-supplier">
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
