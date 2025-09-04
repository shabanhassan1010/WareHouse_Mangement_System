import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

interface WarehouseArea {
  areaName: string;
  minmumPrice: number;
}

interface Warehouse {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  governate: string;
  isTrusted: boolean;
  imageUrl?: string;
  wareHouseAreas: WarehouseArea[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css'],
})
export class Profile implements OnInit {
  warehouse: Warehouse | null = null;
  loading: boolean = true;
  error: string = '';
  isEditMode: boolean = false;
  submitting: boolean = false;
  warehouseForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.warehouseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      governate: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.fetchWarehouseData();
  }

  goBack() {
    // Try to go back in browser history, if not available go to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard/home']);
    }
  }

  fetchWarehouseData() {
    const warehouseData = JSON.parse(
      localStorage.getItem('warehouseData') || '{}'
    );
    const warehouseId = warehouseData?.id || '73'; // fallback to 73 as specified

    // console.log('Fetching warehouse data for ID:', warehouseId);

    fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/Getbyid/${warehouseId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        // console.log('Response status:', res.status);
        if (!res.ok) {
          throw new Error(
            `فشل في جلب بيانات المستودع: ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        // console.log('Warehouse data received:', data);
        this.warehouse = data;
        this.populateForm();
        this.loading = false;
      })
      .catch((err) => {
        // console.error('Error fetching warehouse data:', err);
        this.error = err.message || 'حدث خطأ أثناء جلب البيانات';
        this.loading = false;
      });
  }

  populateForm() {
    if (this.warehouse) {
      this.warehouseForm.patchValue({
        name: this.warehouse.name,
        email: this.warehouse.email,
        phone: this.warehouse.phone,
        address: this.warehouse.address,
        governate: this.warehouse.governate,
      });
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.populateForm();
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.warehouseForm.reset();
    this.populateForm();
  }

  updateWarehouse() {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.warehouseForm.value;

    // console.log('Updating warehouse with data:', formData);

    fetch(
      `http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/UpdateWarehouse/${this.warehouse?.id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `فشل في تحديث بيانات المستودع: ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {
        // console.log('Warehouse updated successfully:', data);
        this.warehouse = { ...this.warehouse, ...formData };
        this.isEditMode = false;
        this.submitting = false;
        alert('تم تحديث بيانات المستودع بنجاح');
      })
      .catch((err) => {
        // console.error('Error updating warehouse:', err);
        this.submitting = false;
        alert('حدث خطأ أثناء تحديث البيانات: ' + err.message);
      });
  }

  getProfileImage() {
    return this.warehouse &&
      this.warehouse.imageUrl && this.warehouse.imageUrl !== 'string'
      ? 'http://www.pharmaatoncepredeploy.somee.com/'+ this.warehouse.imageUrl 
      : 'https://ui-avatars.com/api/?name=Warehouse&background=0D8ABC&color=fff&rounded=true&size=128';
  }

  getTrustedStatus(): string {
    if (!this.warehouse) return 'غير محدد';
    return this.warehouse.isTrusted ? 'نعم' : 'لا';
  }

  getTrustedStatusClass(): string {
    if (!this.warehouse) return 'text-muted';
    return this.warehouse.isTrusted ? 'text-success' : 'text-danger';
  }

  // Form validation helper methods
  getFieldError(fieldName: string): string {
    const control = this.warehouseForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'هذا الحقل مطلوب';
      if (control.errors['email']) return 'البريد الإلكتروني غير صحيح';
      if (control.errors['minlength'])
        return `الحد الأدنى ${control.errors['minlength'].requiredLength} أحرف`;
      if (control.errors['pattern']) return 'التنسيق غير صحيح';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.warehouseForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }
}
