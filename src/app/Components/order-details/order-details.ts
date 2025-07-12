import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  medicineName: string;
  quantity: number;
  price: number;
}

@Component({
  selector: 'app-order-details',
  imports: [RouterModule, CommonModule],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css'
})
export class OrderDetails implements OnInit {
  orderId: number = 0;
  order: Order | null = null;
  loading: boolean = false;
  error: string | null = null;
  showAdditionalDetails: boolean = false;
  showAllDetails: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get order ID from route parameters
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      if (this.orderId) {
        this.loadOrderDetails();
      } else {
        this.error = 'رقم الطلب غير صحيح';
      }
    });
  }

  toggleAdditionalDetails() {
    this.showAdditionalDetails = !this.showAdditionalDetails;
  }

  toggleAllDetails() {
    this.showAllDetails = !this.showAllDetails;
  }

  formatOrderDate(dateString: string | null): string {
    if (!dateString) {
      return 'تاريخ غير متوفر';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'تاريخ غير صحيح';
      }
      return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'تاريخ غير صحيح';
    }
  }

  loadOrderDetails() {
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
      } catch (e) {
        console.error('Error parsing warehouse data:', e);
      }
    }

    console.log('Loading order details for order ID:', this.orderId);
    console.log('From warehouse:', warehouseId);

    fetch(`https://localhost:7250/api/Order/warehouse/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log('Orders response status:', response.status);
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data: any) => {
        console.log('Orders response data:', data);
        
        // Handle the response structure with 'result' property
        let orders: Order[] = [];
        if (data.result && Array.isArray(data.result)) {
          orders = data.result;
        } else if (Array.isArray(data)) {
          orders = data;
        } else {
          throw new Error('Unexpected data structure');
        }
        
        // Find the specific order
        this.order = orders.find(order => order.orderId === this.orderId) || null;
        
        if (!this.order) {
          this.error = 'لم يتم العثور على الطلب المطلوب';
        } else {
          // Debug the order data
          console.log('Found order:', this.order);
          console.log('Order date:', this.order.orderDate);
          console.log('Order date type:', typeof this.order.orderDate);
          
          // If orderDate is null or undefined, set a default value
          if (!this.order.orderDate) {
            this.order.orderDate = new Date().toISOString();
            console.log('Set default order date:', this.order.orderDate);
          }
        }
        
        console.log('Final order object:', this.order);
        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading order details:', error);
        this.error = error.message;
        this.loading = false;
      });
  }

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

  updateOrderStatus(newStatus: string) {
    if (!this.order) return;

    const token = localStorage.getItem('authToken');
    const statusEnumValue = this.getStatusEnumValue(newStatus);
    
    fetch(`https://localhost:7250/api/Order/update-status/${this.order.orderId}?newStatus=${statusEnumValue}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to update order status');
        // Update local order status
        if (this.order) {
          this.order.status = newStatus;
        }
        alert('تم تحديث حالة الطلب بنجاح');
      })
      .catch(error => {
        console.error('Error updating order status:', error);
        alert('حدث خطأ في تحديث حالة الطلب: ' + error.message);
      });
  }
} 