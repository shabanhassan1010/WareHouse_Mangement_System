import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../Core/Services/order-service';

interface Order {
  orderId: number;
  totalPrice: number;
  quantity: number;
  status: string;
  pharmacyId: number;
  pharmacyName: string;
  orderDate: string;
  medicines: OrderItem[];
}

interface OrderItem {
  medicineId: number;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // medicines: Medicine[] = [];
  orders: Order[] = [];
  loading: boolean = false;
  error: string | null = null;
  activeTab: 'medicines' | 'orders' = 'medicines';

  // Search and filter properties
  searchTerm: string = '';
  selectedDrug: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  hasMorePages: boolean = true;
  private searchTimeout: any;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private orderService: OrderService
  ) {}

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'Ordered':
        return 'تم الطلب';
      case 'Preparing':
        return 'قيد التحضير';
      case 'Delivering':
        return 'قيد التوصيل';
      case 'Delivered':
        return 'تم التوصيل';
      case 'Cancelled':
        return 'ملغي';
      case 'Returned':
        return 'مرتجع';
      default:
        return status;
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // this.fetchMedicines();
      this.fetchOrders();
    }
    this.orderService.ordersUpdated$.subscribe((orderId) => {
      // Search on order in array
      const index = this.orders.findIndex((o) => o.orderId === orderId);

      if (index !== -1) {
        // update order status
        this.fetchSingleOrder(orderId).then((order) => {
          if (order) this.orders[index] = order;
        });
      } else {
        // if order is not exist i will get all orders
        this.fetchOrders();
      }
    });
  }

  // Helper to fetch a single order by id
  fetchSingleOrder(orderId: number): Promise<Order | undefined> {
    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    let warehouseId;

    if (warehouseData) {
      const warehouse = JSON.parse(warehouseData);
      warehouseId = warehouse.id;
    }

    // http://www.pharmaatoncepredeploy.somee.com
    return fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Order/warehouse/${warehouseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: any) => {
        let orders: Order[] = [];

        if (data.result && Array.isArray(data.result)) {
          orders = data.result;
        } else if (Array.isArray(data)) {
          orders = data;
        } else {
          return undefined;
        }

        return orders.find((o: Order) => o.orderId === orderId);
      });
  }

  fetchOrders() {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    let warehouseId;

    if (warehouseData) {
      const warehouse = JSON.parse(warehouseData);
      warehouseId = warehouse.id;
    }

    fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Order/warehouse/${warehouseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to fetch orders: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data: any) => {
        if (data.result && Array.isArray(data.result)) {
          this.orders = data.result;
        } else if (Array.isArray(data)) {
          this.orders = data;
        } else {
          this.orders = [];
        }

        this.loading = false;
      })
      .catch((error) => {
        this.error = null;
        this.loading = false;
      });
  }

  setActiveTab(tab: 'medicines' | 'orders') {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.fetchOrders();
    }
  }

  showOrderDetails(order: Order) {
    this.router.navigate(['/dashboard/order-details', order.orderId]);
  }

  get paginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.orders.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.orders.length / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
