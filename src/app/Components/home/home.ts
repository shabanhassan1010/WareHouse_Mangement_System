import { Component, OnInit , Inject , PLATFORM_ID  } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule , isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../Core/Services/order-service';

// interface Medicine {
//   medicineId: number;
//   englishMedicineName: string;
//   arabicMedicineName: string;
//   drug: number;
//   price: number;
//   medicineUrl: string;
//   finalprice: number;
//   quantity: number;
//   discount: number;
// }

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
  styleUrl: './home.css'
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
    private router : Router  ,
    @Inject(PLATFORM_ID) private platformId: Object,
    private orderService: OrderService
    ) {}

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'Ordered': return 'تم الطلب';
      case 'Preparing': return 'قيد التحضير';
      case 'Delivering': return 'قيد التوصيل';
      case 'Delivered': return 'تم التوصيل';
      case 'Cancelled': return 'ملغي';
      case 'Returned': return 'مرتجع';
      default: return status;
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // this.fetchMedicines();
      this.fetchOrders();
    }
      this.orderService.ordersUpdated$.subscribe(orderId => {

        // Search on order in array
        const index = this.orders.findIndex(o => o.orderId === orderId);

        if (index !== -1) {
          // update order status
          this.fetchSingleOrder(orderId).then(order => {
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
    let warehouseId = '73';
    
    if (warehouseData) {
      try {
        const warehouse = JSON.parse(warehouseData);
        warehouseId = warehouse.id || '73';
      } catch (e) {
        console.error(e);
      }
    }

    return fetch(`https://localhost:7250/api/Order/warehouse/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then((data: Order[]) => {
        // TypeScript-safe: data is already Order[]
        return data.find((o: Order) => o.orderId === orderId);
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
    let warehouseId = '73';
    
    if (warehouseData) {
      try {
        const warehouse = JSON.parse(warehouseData);
        warehouseId = warehouse.id || '73';
      } catch (e) {
        console.error('Error parsing warehouse data:', e);
      }
    }
    
    fetch(`https://localhost:7250/api/Order/warehouse/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: any) => {
        if (data.result && Array.isArray(data.result)) {
          this.orders = data.result;
        } else if (Array.isArray(data)) {
          this.orders = data;
        } else {
          console.error('Unexpected orders data structure:', data);
          this.orders = [];
        }
        
        this.loading = false;
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        this.error = error.message;
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


  // All code for Medicine

  //[1]
  // clearFilters() {
  //   this.searchTerm = '';
  //   this.selectedDrug = '';
  //   this.currentPage = 1;
    
  //   // Use cache if available
  //   if (this.medicinesCache.length > 0) {
  //     this.medicines = [...this.medicinesCache];
  //     this.hasMorePages = this.medicines.length === this.pageSize;
  //   } else {
  //     this.fetchMedicines();
  //   }
  // }

  // [2]
  // fetchMedicines() {
  //   if (!isPlatformBrowser(this.platformId)) {
  //     this.loading = false;
  //     return;
  //   }
    
  //   this.loading = true;
  //   this.error = null;
    
  //   const token = localStorage.getItem('authToken');
  //   const warehouseData = localStorage.getItem('warehouseData');
  //   let warehouseId = '2';
    
  //   if (warehouseData) {
  //     try {
  //       const warehouse = JSON.parse(warehouseData);
  //       warehouseId = warehouse.id || '2';
  //     } catch (e) {
  //       console.error('Error parsing warehouse data:', e);
  //     }
  //   }
    
  //   let url = `/api/Warehouse/GetWarehousMedicines/${warehouseId}/medicines?page=${this.currentPage}&pageSize=${this.pageSize}`;
    
  //   if (this.searchTerm.trim()) {
  //     url += `&search=${encodeURIComponent(this.searchTerm.trim())}`;
  //   }
    
  //   if (this.selectedDrug) {
  //     url += `&drug=${parseInt(this.selectedDrug)}`; // Convert to number
  //   }

  //   fetch(url, {
  //     headers: {
  //       'Authorization': `Bearer ${token}`,
  //       'Content-Type': 'application/json'
  //     }
  //   })
  //     .then(response => {
  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch medicines: ${response.status} ${response.statusText}`);
  //       }
  //       return response.json();
  //     })
  //     .then((data) => {
  //       if (Array.isArray(data)) {
  //         this.medicines = data;
  //         this.medicinesCache = [...data]; // Cache the results
  //         this.hasMorePages = data.length === this.pageSize;
  //       } else if (data.items && Array.isArray(data.items)) {
  //         this.medicines = data.items;
  //         this.medicinesCache = [...data.items];
  //         this.hasMorePages = data.items.length === this.pageSize;
  //       } else if (data.data && Array.isArray(data.data)) {
  //         this.medicines = data.data;
  //         this.medicinesCache = [...data.data];
  //         this.hasMorePages = data.data.length === this.pageSize;
  //       } else {
  //         console.error('Unexpected data structure:', data);
  //         this.medicines = [];
  //         this.medicinesCache = [];
  //         this.hasMorePages = false;
  //       }
        
  //       this.loading = false;
  //     })
  //     .catch(error => {
  //       console.error('Error fetching medicines:', error);
  //       this.error = error.message;
  //       this.loading = false;
  //     });
  // }

  // Filter medicines locally for better performance
  // filterMedicinesLocally() {
  //   if (!this.medicinesCache || this.medicinesCache.length === 0) return;
    
  //   let filtered = [...this.medicinesCache];
    
  //   // Apply search filter
  //   if (this.searchTerm.trim()) {
  //     const searchLower = this.searchTerm.trim().toLowerCase();
  //     filtered = filtered.filter(medicine => 
  //       medicine.englishMedicineName?.toLowerCase().includes(searchLower) || 
  //       medicine.arabicMedicineName?.toLowerCase().includes(searchLower)
  //     );
  //   }
    
  //   // Apply drug type filter
  //   if (this.selectedDrug) {
  //     const drugValue = parseInt(this.selectedDrug);
  //     filtered = filtered.filter(medicine => medicine.drug === drugValue);
  //   }
    
  //   this.medicines = filtered;
  //   this.hasMorePages = false; // Disable pagination for local filtering
  // }

  // onFilterChange() {
  //   this.currentPage = 1;
    
  //   // If we have cache, filter locally
  //   if (this.medicinesCache.length > 0 && !this.searchTerm.trim()) {
  //     this.filterMedicinesLocally();
  //   } else {
  //     this.fetchMedicines();
  //   }
  // }

  // onPageChange(page: number) {
  //   if (page < 1) return;
  //   this.currentPage = page;
  //   this.fetchMedicines();
  // }

  // [3]
  // clearSearch() {
  //   this.searchTerm = '';
  //   this.currentPage = 1;
    
  //   // Use cache if available
  //   if (this.medicinesCache.length > 0) {
  //     this.filterMedicinesLocally();
  //   } else {
  //     this.fetchMedicines();
  //   }
  // }


  // [4]
  // onSearchInput() {
  //   if (this.searchTimeout) {
  //     clearTimeout(this.searchTimeout);
  //   }
    
  //   this.searchTimeout = setTimeout(() => {
  //     this.currentPage = 1;
      
  //     // If we have cache and search term is short, filter locally
  //     if (this.medicinesCache.length > 0 && this.searchTerm.trim().length <= 3) {
  //       this.filterMedicinesLocally();
  //     } else {
  //       this.fetchMedicines();
  //     }
  //   }, 500);
  // }

  // [5]
  // private medicinesCache: Medicine[] = []; // Cache for better performance
  // drugOptions = [
  //   { value: '', label: 'جميع الأدوية والمستحضرات' },
  //   { value: '0', label: 'أدوية' },
  //   { value: '1', label: 'مستحضرات تجميل' }
  // ];

  // [6]
  // getDrugText(drugNumber: number): string {
  //   switch (drugNumber) {
  //     case 0: return 'أدوية';
  //     case 1: return 'مستحضرات تجميل';
  //     default: return 'غير محدد';
  //   }
  // }
  
}