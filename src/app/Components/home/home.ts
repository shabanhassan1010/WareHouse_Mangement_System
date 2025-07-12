import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Medicine {
  medicineId: number;
  englishMedicineName: string;
  arabicMedicineName: string;
  drug: number;
  price: number;
  medicineUrl: string;
  finalprice: number;
  quantity: number;
  discount: number;
}

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
  medicines: Medicine[] = [];
  orders: Order[] = [];
  loading: boolean = false;
  error: string | null = null;
  activeTab: 'medicines' | 'orders' = 'medicines';
  
  // Search and filter properties
  searchTerm: string = '';
  selectedDrug: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  hasMorePages: boolean = true; // Track if there are more pages
  private searchTimeout: any; // For debouncing search

  // Improved drug options for filter
  drugOptions = [
    { value: '', label: 'جميع الأدوية والمستحضرات' },
    { value: '0', label: 'أدوية' },
    { value: '1', label: 'مستحضرات تجميل' }
  ];

  constructor(private router: Router) {}

  // Method to convert drug number to text
  getDrugText(drugNumber: number): string {
    switch (drugNumber) {
      case 0:
        return 'أدوية';
      case 1:
        return 'مستحضرات تجميل';
      default:
        return 'غير محدد';
    }
  }

  // Method to convert order status to Arabic text
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

  // Map status names to enum values
  getStatusEnumValue(status: string): number {
    switch (status) {
      case 'Ordered':
        return 0;
      case 'Delivered':
        return 1;
      case 'Cancelled':
        return 2;
      case 'Returned':
        return 3;
      case 'Preparing':
        return 4;
      case 'Delivering':
        return 5;
      default:
        return 0; // Default to Ordered
    }
  }

  ngOnInit() {
    console.log('Home component initialized');
    console.log('Starting to fetch medicines...');
    this.fetchMedicines();
    this.fetchOrders();
  }

  // Test method to manually fetch medicines
  testFetchMedicines() {
    console.log('Manual test - fetching medicines');
    this.fetchMedicines();
  }

  // Check authentication status
  checkAuth() {
    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    console.log('=== AUTHENTICATION CHECK ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('Warehouse data exists:', !!warehouseData);
    if (warehouseData) {
      try {
        const warehouse = JSON.parse(warehouseData);
        console.log('Warehouse ID:', warehouse.id);
        console.log('Warehouse name:', warehouse.name);
      } catch (e) {
        console.error('Error parsing warehouse data:', e);
      }
    }
    console.log('==========================');
  }

  // Real-time search with debouncing
  onSearchInput() {
    console.log('Search input event triggered, searchTerm:', this.searchTerm);
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      console.log('Cleared previous search timeout');
    }
    
    // Set new timeout for 500ms delay
    this.searchTimeout = setTimeout(() => {
      console.log('Search timeout triggered, searchTerm:', this.searchTerm);
      console.log('Search term length:', this.searchTerm.length);
      this.currentPage = 1; // Reset to first page
      this.fetchMedicines();
    }, 500); // 500ms delay
  }

  // Clear search and show all medicines
  clearSearch() {
    console.log('Clear search called');
    this.searchTerm = '';
    this.currentPage = 1;
    console.log('Search cleared, showing all medicines');
    this.fetchMedicines();
  }

  fetchMedicines() {
    this.loading = true;
    this.error = null; // Clear previous errors
    
    // Get the stored token and warehouse data
    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    console.log('Auth token:', token ? 'Present' : 'Missing');
    console.log('Warehouse data:', warehouseData);
    
    // Parse warehouse data to get the warehouse ID
    let warehouseId = '2'; // Default fallback
    if (warehouseData) {
      try {
        const warehouse = JSON.parse(warehouseData);
        warehouseId = warehouse.id || '2';
        console.log('Using warehouse ID:', warehouseId);
      } catch (e) {
        console.error('Error parsing warehouse data:', e);
      }
    }
    
    // Build URL with search and filter parameters
    let url = `/api/Warehouse/GetWarehousMedicines/${warehouseId}/medicines?page=${this.currentPage}&pageSize=${this.pageSize}`;
    
    if (this.searchTerm.trim()) {
      url += `&search=${encodeURIComponent(this.searchTerm.trim())}`;
    }
    
    if (this.selectedDrug) {
      url += `&drug=${this.selectedDrug}`;
      console.log('Adding drug filter to URL:', this.selectedDrug);
    }

    console.log('Fetching medicines from URL:', url);

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          console.error('Response not ok:', response.status, response.statusText);
          throw new Error(`Failed to fetch medicines: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Medicines response data:', data);
        
        // Check if data is an array or has a different structure
        if (Array.isArray(data)) {
          this.medicines = data;
          // If we get fewer items than pageSize, we're on the last page
          this.hasMorePages = data.length === this.pageSize;
        } else if (data.items && Array.isArray(data.items)) {
          this.medicines = data.items;
          this.hasMorePages = data.items.length === this.pageSize;
        } else if (data.data && Array.isArray(data.data)) {
          this.medicines = data.data;
          this.hasMorePages = data.data.length === this.pageSize;
        } else {
          console.error('Unexpected data structure:', data);
          this.medicines = [];
          this.hasMorePages = false;
        }
        
        console.log('Medicines array length:', this.medicines.length);
        console.log('Current page:', this.currentPage);
        console.log('Has more pages:', this.hasMorePages);
        this.loading = false;
      })
      .catch(error => {
        console.error('Error fetching medicines:', error);
        this.error = error.message;
        this.loading = false;
      });
  }

  onFilterChange() {
    console.log('=== FILTER CHANGE DEBUG ===');
    console.log('Filter changed, selectedDrug:', this.selectedDrug);
    console.log('Selected drug type:', this.selectedDrug === '0' ? 'أدوية' : this.selectedDrug === '1' ? 'مستحضرات تجميل' : 'جميع الأدوية والمستحضرات');
    this.currentPage = 1; // Reset to first page when filtering
    console.log('Resetting to page 1');
    this.fetchMedicines();
  }

  // Manual test for filter
  testFilter(filterValue: string) {
    console.log('=== MANUAL FILTER TEST ===');
    console.log('Setting filter to:', filterValue);
    this.selectedDrug = filterValue;
    this.currentPage = 1;
    this.fetchMedicines();
  }

  onPageChange(page: number) {
    console.log('Page change requested:', page);
    
    // Prevent going to page 0 or negative
    if (page < 1) {
      console.log('Page number too low, staying on page 1');
      return;
    }
    
    this.currentPage = page;
    console.log('Fetching medicines for page:', this.currentPage);
    this.fetchMedicines();
  }

  clearFilters() {
    console.log('Clear filters called');
    console.log('Before clear - searchTerm:', this.searchTerm, 'selectedDrug:', this.selectedDrug);
    this.searchTerm = '';
    this.selectedDrug = '';
    this.currentPage = 1;
    console.log('After clear - searchTerm:', this.searchTerm, 'selectedDrug:', this.selectedDrug);
    this.fetchMedicines();
  }

  fetchOrders() {
    console.log('Fetching orders from warehouse...');
    this.loading = true;
    this.error = null;
    
    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    
    // Get warehouse ID from stored data
    let warehouseId = '73'; // Default warehouse ID
    if (warehouseData) {
      try {
        const warehouse = JSON.parse(warehouseData);
        warehouseId = warehouse.id || '73';
        console.log('Using warehouse ID for orders:', warehouseId);
      } catch (e) {
        console.error('Error parsing warehouse data:', e);
      }
    }
    
    console.log('Fetching orders from endpoint:', `https://localhost:7250/api/Order/warehouse/${warehouseId}`);
    
    fetch(`https://localhost:7250/api/Order/warehouse/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Orders response status:', response.status);
        if (!response.ok) {
          console.error('Orders response not ok:', response.status, response.statusText);
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: any) => {
        console.log('Orders response data:', data);
        
        // Handle the response structure with 'result' property
        if (data.result && Array.isArray(data.result)) {
          this.orders = data.result;
          console.log('Orders loaded from result array:', this.orders.length);
        } else if (Array.isArray(data)) {
          this.orders = data;
          console.log('Orders loaded from direct array:', this.orders.length);
        } else {
          console.error('Unexpected orders data structure:', data);
          this.orders = [];
        }
        
        console.log('Final orders array:', this.orders);
        this.loading = false;
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        this.error = error.message;
        this.loading = false;
      });
  }

  // Test method to manually fetch orders
  testFetchOrders() {
    console.log('=== MANUAL ORDERS TEST ===');
    console.log('Current orders array length:', this.orders.length);
    console.log('Active tab:', this.activeTab);
    console.log('Loading state:', this.loading);
    this.fetchOrders();
  }

  deleteMedicine(medicineId: number) {
    if (confirm('Are you sure you want to delete this medicine?')) {
      const token = localStorage.getItem('authToken');
      fetch(`/api/Warehouse/DeleteMedicine/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete medicine');
          this.fetchMedicines(); // Refresh the list
        })
        .catch(error => {
          this.error = error.message;
        });
    }
  }

  updateOrderStatus(orderId: number, newStatus: string) {
    const token = localStorage.getItem('authToken');
    const statusEnumValue = this.getStatusEnumValue(newStatus);
    
    fetch(`https://localhost:7250/api/Order/update-status/${orderId}?newStatus=${statusEnumValue}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to update order status');
        this.fetchOrders(); // Refresh the orders list
        alert('تم تحديث حالة الطلب بنجاح');
      })
      .catch(error => {
        this.error = error.message;
        alert('حدث خطأ في تحديث حالة الطلب: ' + error.message);
      });
  }

  setActiveTab(tab: 'medicines' | 'orders') {
    console.log('Switching to tab:', tab);
    this.activeTab = tab;
    
    // Fetch orders when orders tab is selected
    if (tab === 'orders') {
      console.log('Orders tab selected, fetching orders...');
      this.fetchOrders();
    }
  }

  showOrderDetails(order: Order) {
    console.log('=== NAVIGATE TO ORDER DETAILS ===');
    console.log('Order ID:', order.orderId);
    console.log('Order data:', order);
    
    // Navigate to order details page
    this.router.navigate(['/dashboard/order-details', order.orderId]);
  }
}
