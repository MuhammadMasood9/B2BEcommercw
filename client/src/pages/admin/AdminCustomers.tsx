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
import { insertCustomerSchema, type Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import type { z } from "zod";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Success", description: "Customer deleted successfully" });
    },
  });

  const filteredCustomers = customers?.filter(c => 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-customers-title">Customers</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCustomer(null)} data-testid="button-add-customer">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
            </DialogHeader>
            <CustomerForm customer={selectedCustomer} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-customers" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${customer.id}`}>
                      {customer.firstName} {customer.lastName}
                    </TableCell>
                    <TableCell data-testid={`text-email-${customer.id}`}>{customer.email}</TableCell>
                    <TableCell data-testid={`text-company-${customer.id}`}>{customer.company || '-'}</TableCell>
                    <TableCell data-testid={`text-country-${customer.id}`}>{customer.country || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-type-${customer.id}`}>{customer.accountType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedCustomer(customer); setIsDialogOpen(true); }} data-testid={`button-edit-${customer.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => confirm("Delete?") && deleteMutation.mutate(customer.id)} data-testid={`button-delete-${customer.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No customers found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerForm({ customer, onSuccess }: { customer: Customer | null; onSuccess: () => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: customer || { email: "", accountType: "buyer", isVerified: false },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerSchema>) => {
      if (customer) {
        return await apiRequest("PATCH", `/api/customers/${customer.id}`, data);
      } else {
        return await apiRequest("POST", "/api/customers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Success", description: customer ? "Customer updated" : "Customer created" });
      onSuccess();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-first-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-last-name" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl><Input {...field} type="email" data-testid="input-email" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl><Input {...field} value={field.value || ""} data-testid="input-company" /></FormControl>
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

        <FormField control={form.control} name="country" render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl><Input {...field} value={field.value || ""} data-testid="input-country" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="isVerified" render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl><Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-verified" /></FormControl>
            <FormLabel className="!mt-0">Verified</FormLabel>
          </FormItem>
        )} />

        <Button type="submit" disabled={mutation.isPending} data-testid="button-save-customer">
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </Form>
  );
}
