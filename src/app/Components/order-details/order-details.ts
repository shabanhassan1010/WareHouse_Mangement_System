import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  medicineName: string;
  quantity: number;
  price: number;
  discount: number
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
  updatingStatus: boolean = false; // Track status update in progress

  constructor(
    private route: ActivatedRoute,
    private router: Router ,
    private orderService : OrderService
  ) {}

  ngOnInit() {
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
    if (!dateString) return 'تاريخ غير متوفر';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
      
      return date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      // console.error('Error formatting date:', error);
      return 'تاريخ غير صحيح';
    }
  }

  loadOrderDetails() {
    this.loading = true;
    this.error = null;

    const token = localStorage.getItem('authToken');
    const warehouseData = localStorage.getItem('warehouseData');
    
    let warehouseId;
    if (warehouseData) {
        const warehouse = JSON.parse(warehouseData);
        warehouseId = warehouse.id ;
    }

    fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Order/warehouse/${warehouseId}`, {
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
        let orders: Order[] = [];
        if (data.result && Array.isArray(data.result)) {
          orders = data.result;
        } else if (Array.isArray(data)) {
          orders = data;
        } else {
          throw new Error('Unexpected data structure');
        }
        
        this.order = orders.find(order => order.orderId === this.orderId) || null;
        
        if (!this.order) {
          this.error = 'لم يتم العثور على الطلب المطلوب';
        } else if (!this.order.orderDate) {
          this.order.orderDate = new Date().toISOString();
        }
        
        this.loading = false;
      })
      .catch(error => {
        // console.error('Error loading order details:', error);
        this.error = error.message;
        this.loading = false;
      });
  }

   // Define valid status progression
  private statusHierarchy = ['Ordered', 'Preparing', 'Delivering', 'Delivered'];
  private terminalStatuses = ['Delivered', 'Cancelled', 'Returned'];

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'Ordered': return 'تم الطلب';
      case 'Preparing': return 'قيد التحضير';
      case 'Delivering': return 'قيد التوصيل';
      case 'Delivered': return 'تم التوصيل';
      case 'Returned': return 'مرتجع';
      case 'Cancelled': return 'ملغي';
      default: return status;
    }
  }

  getStatusEnumValue(status: string): number {
    switch (status) {
      case 'Ordered': return 0;
      case 'Preparing': return 1;
      case 'Delivering': return 2;
      case 'Delivered': return 3;
      case 'Returned': return 4;
      case 'Cancelled': return 5;
      default: return 0;
    }
  }

  // Check if status transition is allowed
  isStatusChangeAllowed(newStatus: string): boolean {
    if (!this.order) return false;
    
    const currentStatus = this.order.status;
    
    if (this.terminalStatuses.includes(currentStatus)) {
    return false;
    }

    if (newStatus === 'Cancelled') {
      return currentStatus == 'Ordered';
    }

    // Prevent reverting to previous statuses
    const currentIndex = this.statusHierarchy.indexOf(currentStatus);
    const newIndex = this.statusHierarchy.indexOf(newStatus);
    
    if (currentIndex !== -1 && newIndex !== -1) {
      // Only allow moving forward in the hierarchy
      return newIndex > currentIndex;
    }
    
    // Prevent other invalid transitions
    return false;
  }

  updateOrderStatus(newStatus: string) {
    if (!this.order || this.updatingStatus) return;
    
    // Validate status transition
    if (!this.isStatusChangeAllowed(newStatus)) {
      alert('لا يمكن الرجوع إلى حالة سابقة أو غير مسموح بها');
      return;
    }

    this.updatingStatus = true;
    const token = localStorage.getItem('authToken');
    const statusEnumValue = this.getStatusEnumValue(newStatus);
    
    fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Order/update-status/${this.order.orderId}?newStatus=${statusEnumValue}`, {
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
            // Notify Home component
         this.orderService.notifyOrderUpdated(this.order!.orderId);
        alert('تم تحديث حالة الطلب بنجاح');
        this.updatingStatus = false;
      })
      .catch(error => {
        // console.error('Error updating order status:', error);
        alert('حدث خطأ في تحديث حالة الطلب: ' + error.message);
        this.updatingStatus = false;
      });
  }
}