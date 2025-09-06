import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';   // ✅ add this
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HttpClient, HttpParams } from '@angular/common/http';

import { CommonModule } from '@angular/common';
import { OrderService } from '../../Core/Services/order-service';


export interface InvoiceItem {
  medicineName: string;
  arabicMedicineName: string;
  medicineImage: string;
  medicinePrice: number;
  quantity: number;
  totalPriceBeforeDisccount: number;
  totalPriceAfterDisccount: number;
  discountAmount: number;
  discountPercentage: number;
  pharmacyName: string;
  wareHouseName: string;
}

export interface InvoiceResponse {
  message: string;
  result: InvoiceItem[];
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
  updatingStatus: boolean = false; // Track status update in progress



  constructor(
    private route: ActivatedRoute,
    private router: Router ,
    private orderService : OrderService,
    private http: HttpClient
  ) {}



  getOrderDetailsForAdminDashboard(orderId: number): Observable<InvoiceResponse> {
    return this.http.get<InvoiceResponse>(
      `/api/Order/getAllOrderDetailsForAdminDashboard/${orderId}`
    );
  }

  invoiceData: InvoiceItem[] = [];
  invoiceOrderId?: number;
  
  loadOrderDetailsForInvoice(orderId: number): void {
    this.getOrderDetailsForAdminDashboard(orderId).subscribe({
      next: (res) => {
        this.invoiceData = res.result;
        this.invoiceOrderId = orderId;
      },
      error: (err) => {
        console.error('Error fetching invoice data:', err);
      }
    });
  }
  printOrderPdf(): void {

    if (!this.invoiceData || this.invoiceData.length === 0) return;
  
    const doc = new jsPDF();
  
    this.fetchFontAsBase64('assets/fonts/Amiri-Regular.ttf').then((base64) => {
      (doc as any).addFileToVFS('Amiri-Regular.ttf', base64);
      (doc as any).addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri');
  
      const img = new Image();
      img.src = 'assets/img/logo.jpg';
      img.onload = () => {
        doc.addImage(img, 'JPG', 160, 10, 40, 30);
        addContent();
      };
  
      const addContent = () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const orderInfo = this.invoiceData[0]; // ✅ take header info from first item
  
        // Header
        doc.setFontSize(18);
        doc.text('Pharma At Once', 105, 30, { align: 'center' });
        doc.text('فاتورة بيع', 105, 50, { align: 'center' });
  
        // Customer / Order info
        doc.setFontSize(12);
        doc.text(`رقم الطلب: ${this.invoiceOrderId}`, 200, 70, { align: 'right' });
        doc.text(`التاريخ: ${this.order?.orderDate}`, 200, 80, { align: 'right' });
        doc.text(`${orderInfo.wareHouseName} :مخزن`, 200, 90, { align: 'right' });
        doc.text(`${orderInfo.pharmacyName} :صيدلية`, 200, 100, { align: 'right' });
        doc.line(10, 105, pageWidth - 10, 105);
  
        // Table
        autoTable(doc, {
          head: [
            [
              'م',
              'الصنف',
              'الكمية',
              'السعر (ج.م)',
              'الخصم %',
              'القيمة قبل الخصم',
              'القيمة بعد الخصم',
            ].reverse(),
          ],
          body: this.invoiceData.map((item, index) =>
            [
              index + 1,
              item.arabicMedicineName,
              item.quantity,
              item.medicinePrice.toFixed(2),
              `${item.discountPercentage.toFixed(2)}%`,
              item.totalPriceBeforeDisccount.toFixed(2),
              item.totalPriceAfterDisccount.toFixed(2),
            ].reverse()
          ),
          startY: 110,
          styles: { halign: 'right', font: 'Amiri', fontStyle: 'normal' },
          headStyles: { fillColor: [200, 200, 200], halign: 'center' },
        });
  
        // Totals
        let finalY = (doc as any).lastAutoTable.finalY + 20;
        const totalBefore = this.invoiceData.reduce(
          (sum, i) => sum + i.totalPriceBeforeDisccount,
          0
        );
        const discount = this.invoiceData.reduce(
          (sum, i) => sum + i.discountAmount,
          0
        );
        const totalAfter = this.invoiceData.reduce(
          (sum, i) => sum + i.totalPriceAfterDisccount,
          0
        );
  
        doc.text(`الإجمالي قبل الخصم: ${totalBefore.toFixed(2)} ج.م`, 200, finalY, { align: 'right' });
        finalY += 10;
        doc.text(`إجمالي الخصم: ${discount.toFixed(2)} ج.م`, 200, finalY, { align: 'right' });
        finalY += 10;
        doc.text(`الإجمالي بعد الخصم: ${totalAfter.toFixed(2)} ج.م`, 200, finalY, { align: 'right' });
  
        // Save file
        doc.save(`invoice_order_${this.invoiceOrderId}.pdf`);
      };
  
      img.onerror = () => addContent();
    });
  }
  fetchFontAsBase64(url: string): Promise<string> {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as any);
        }
        return btoa(binary);
      });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      if (this.orderId) {
        this.loadOrderDetails();
       this.loadOrderDetailsForInvoice(this.orderId);

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
    
    // Prevent reverting to previous statuses
    const currentIndex = this.statusHierarchy.indexOf(currentStatus);
    const newIndex = this.statusHierarchy.indexOf(newStatus);
    
    if (currentIndex !== -1 && newIndex !== -1) {
      // Only allow moving forward in the hierarchy
      return newIndex > currentIndex;
    }
    
    // the finial status can not go to it
    if (this.terminalStatuses.includes(currentStatus)) {
    return false;
     }

    // Allow terminal status changes at any time
    if (this.terminalStatuses.includes(newStatus)) {
      return true;
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