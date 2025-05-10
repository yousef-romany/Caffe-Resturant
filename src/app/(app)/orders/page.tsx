"use client";

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/custom/PageHeader';
import { DUMMY_ORDERS, type Order, type OrderStatus, type OrderType } from '@/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Eye, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from 'next/image';


const ORDER_STATUSES: OrderStatus[] = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
const ORDER_TYPES: OrderType[] = ["Dine-in", "Takeaway", "Delivery"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'All'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setOrders(DUMMY_ORDERS.sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (order.tableNumber && order.tableNumber.includes(searchTerm))) &&
      (statusFilter === 'All' || order.status === statusFilter) &&
      (typeFilter === 'All' || order.type === typeFilter)
    );
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'Completed': return 'default'; // bg-primary
      case 'Pending': return 'secondary'; // bg-secondary
      case 'Preparing': return 'outline'; // text-foreground, border
      case 'Ready': return 'default'; // bg-primary but maybe different color? Using default for now
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTypeFilter('All');
  };

  return (
    <>
      <PageHeader title="Order History" description="View and manage all customer orders." />

      <div className="mb-6 p-4 bg-card rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="searchOrders" className="text-sm font-medium">Search</Label>
            <Input
              id="searchOrders"
              type="search"
              placeholder="Order #, Customer, Table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="statusFilter" className="text-sm font-medium">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'All')}>
              <SelectTrigger id="statusFilter" className="mt-1">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {ORDER_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="typeFilter" className="text-sm font-medium">Order Type</Label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as OrderType | 'All')}>
              <SelectTrigger id="typeFilter" className="mt-1">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {ORDER_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={resetFilters} variant="outline" className="w-full md:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead> {/* For Customer/Table/Captain */}
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient && filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'PPpp')}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>
                      {order.type === 'Dine-in' && order.tableNumber && `Table: ${order.tableNumber}`}
                      {order.type === 'Delivery' && order.customerName && `${order.customerName}`}
                      {order.type === 'Delivery' && order.captainName && ` (Capt: ${order.captainName})`}
                      {order.type === 'Takeaway' && order.customerName && `${order.customerName}`}
                    </TableCell>
                    <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : isClient ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                Date: {format(new Date(selectedOrder.createdAt), 'PPpp')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
              <p><strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
              <p><strong>Type:</strong> {selectedOrder.type}</p>
              {selectedOrder.type === 'Dine-in' && selectedOrder.tableNumber && <p><strong>Table:</strong> {selectedOrder.tableNumber}</p>}
              {selectedOrder.customerName && <p><strong>Customer:</strong> {selectedOrder.customerName}</p>}
              {selectedOrder.type === 'Delivery' && selectedOrder.deliveryAddress && <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>}
              {selectedOrder.type === 'Delivery' && selectedOrder.captainName && <p><strong>Captain:</strong> {selectedOrder.captainName}</p>}
              
              <h4 className="font-semibold mt-4">Items:</h4>
              <ul className="space-y-2">
                {selectedOrder.items.map(item => (
                  <li key={item.id} className="flex items-start gap-3 p-2 border rounded-md">
                    <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md h-12 w-12 object-cover" data-ai-hint={item.dataAiHint || "food item"}/>
                    <div className="flex-grow">
                      <p className="font-medium">{item.name} <span className="text-muted-foreground text-sm">x {item.quantity}</span></p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                      {item.notes && <p className="text-xs text-blue-600 italic">Notes: {item.notes}</p>}
                    </div>
                    <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  </li>
                ))}
              </ul>
              <Separator className="my-3"/>
              <div className="flex justify-end items-center">
                <p className="text-lg font-bold">Total: ${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
