import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-medicine-edit-form',
  templateUrl: './medicine-edit-form.html',
  styleUrls: ['./medicine-edit-form.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class MedicineEditFormComponent implements OnInit {
  medicineForm: FormGroup;
  medicineId: number = 0;
  warehouseId: string | null = null;
  loading = true;
  error: string | null = null;
  submitting = false;
  isWarehouseTrusted: boolean = false;
  checkingTrustStatus: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.medicineForm = this.fb.group({
      quantity: ['', [Validators.required, Validators.min(0), Validators.max(999999)]],
      discount: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  ngOnInit() {
    this.medicineId = Number(this.route.snapshot.paramMap.get('medicineId'));
    this.warehouseId = localStorage.getItem('warehouseId');
    
    if (!this.medicineId) {
      this.error = 'معرف الدواء غير صحيح';
      this.loading = false;
      return;
    }
    
    if (!this.warehouseId) {
      this.error = 'معرف المستودع غير موجود';
      this.loading = false;
      return;
    }
    
    this.checkWarehouseTrustStatus();
  }

  checkWarehouseTrustStatus() {
    const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '{}');
    const warehouseId = warehouseData?.id || this.warehouseId || '73';
    
    // console.log('Checking trust status for warehouse:', warehouseId);
    
    fetch(`https://localhost:7250/api/Warehouse/Getbyid/${warehouseId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`فشل في جلب بيانات المستودع: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // console.log('Warehouse data for trust check:', data);
        this.isWarehouseTrusted = data.isTrusted || false;
        this.checkingTrustStatus = false;
        
        if (!this.isWarehouseTrusted) {
          this.error = 'عذراً، المستودع غير موثوق. لا يمكن تعديل الأدوية.';
          this.loading = false;
          return;
        }
        
        // If trusted, proceed to fetch medicine data
        this.fetchMedicine();
      })
      .catch(err => {
        // console.error('Error checking warehouse trust status:', err);
        this.error = 'فشل في التحقق من حالة الثقة للمستودع';
        this.checkingTrustStatus = false;
        this.loading = false;
      });
  }

  goBack() {
    this.router.navigate(['/dashboard/medicines']);
  }

  fetchMedicine() {
    this.http.get<any>(`https://localhost:7250/api/WarehouseMedicine/GetMedicineById?medicineId=${this.medicineId}&warehouseId=${this.warehouseId}`)
      .subscribe({
        next: (data) => {
          // console.log('API Response:', data);
          
          // Handle different possible field names for discount
          let discountValue = data.discount;
          if (discountValue === undefined || discountValue === null) {
            discountValue = data.discountPercentage || data.discountPercent || data.discountValue || 0;
          }
          
          // Convert discount to percentage if it's in decimal format (0.15 -> 15)
          if (typeof discountValue === 'number' && discountValue <= 1) {
            discountValue = discountValue * 100;
          }
          
          // console.log('Processed values:', { quantity: data.quantity,discount: discountValue,originalDiscount: data.discount});
          
          // Only patch the fields we want to edit
          this.medicineForm.patchValue({
            quantity: data.quantity,
            discount: discountValue
          });
          this.loading = false;
        },
        error: (err) => {
          this.error = 'تعذر تحميل بيانات الدواء. تأكد من صحة المعرف.';
          this.loading = false;
        }
      });
  }

  onSubmit() {
    if (!this.isWarehouseTrusted) {
      alert('عذراً، المستودع غير موثوق. لا يمكن تعديل الأدوية.');
      return;
    }

    if (this.medicineForm.invalid) {
      this.medicineForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = {
      quantity: this.medicineForm.get('quantity')?.value,
      discount: this.medicineForm.get('discount')?.value
    };

    // console.log('Submitting medicine update:', formData);

    this.http.put(
      `https://localhost:7250/api/WarehouseMedicine/UpdateMedicine/${this.medicineId}?warehouseId=${this.warehouseId}`,
      formData,
      { responseType: 'text' }
    ).subscribe({
      next: (res) => {
        alert('تم تحديث الدواء بنجاح.');
        this.router.navigate(['/dashboard/medicines']);
      },
      error: (err) => {
        alert('حدث خطأ أثناء تحديث الدواء. تأكد من صحة البيانات.');
        this.submitting = false;
      }
    });
  }

  // Helper methods for validation
  getQuantityError(): string {
    const control = this.medicineForm.get('quantity');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'الكمية مطلوبة';
      if (control.errors['min']) return 'الكمية يجب أن تكون أكبر من أو تساوي 0';
      if (control.errors['max']) return 'الكمية كبيرة جداً';
    }
    return '';
  }

  getDiscountError(): string {
    const control = this.medicineForm.get('discount');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'الخصم مطلوب';
      if (control.errors['min']) return 'الخصم يجب أن يكون أكبر من أو يساوي 0';
      if (control.errors['max']) return 'الخصم يجب أن يكون أقل من أو يساوي 100%';
    }
    return '';
  }

  getTrustStatusMessage(): string {
    if (this.checkingTrustStatus) return 'جاري التحقق من حالة الثقة...';
    if (this.isWarehouseTrusted) return 'المستودع موثوق - يمكن تعديل الأدوية';
    return 'المستودع غير موثوق - لا يمكن تعديل الأدوية';
  }

  getTrustStatusClass(): string {
    if (this.checkingTrustStatus) return 'text-info';
    return this.isWarehouseTrusted ? 'text-success' : 'text-danger';
  }
} 