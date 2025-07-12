import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medicines.html',
  styleUrls: ['./medicines.css']
})
export class MedicinesComponent implements OnInit {
  medicines: any[] = [];
  allMedicines: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  warehouseId: string = '';
  totalPages: number = 1;
  totalCount: number = 0;
  isWarehouseTrusted: boolean = false;
  checkingTrustStatus: boolean = true;

  // Search and filter
  searchTerm: string = '';
  selectedDrug: string = '';
  drugOptions = [
    { value: '', label: 'كل الأنواع' },
    { value: '0', label: 'أدوية' },
    { value: '1', label: 'مستحضرات تجميل' }
  ];

  showConfirmModal: boolean = false;
  medicineIdToDelete: number | null = null;
  medicineToDelete: any = null;
  deleting: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const warehouseData = JSON.parse(localStorage.getItem('warehouseData') || '{}');
    this.warehouseId = warehouseData?.id || '73'; // fallback for testing
    this.checkWarehouseTrustStatus();
  }

  checkWarehouseTrustStatus() {
    console.log('Checking trust status for warehouse:', this.warehouseId);
    
    fetch(`https://localhost:7250/api/Warehouse/Getbyid/${this.warehouseId}`, {
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
        console.log('Warehouse data for trust check:', data);
        this.isWarehouseTrusted = data.isTrusted || false;
        this.checkingTrustStatus = false;
        
        // Proceed to fetch medicines regardless of trust status
        this.fetchMedicines();
      })
      .catch(err => {
        console.error('Error checking warehouse trust status:', err);
        this.isWarehouseTrusted = false;
        this.checkingTrustStatus = false;
        // Still fetch medicines but mark as non-trusted
        this.fetchMedicines();
      });
  }

  fetchMedicines() {
    const url = `http://localhost:4200/api/Warehouse/GetWarehousMedicines/${this.warehouseId}/medicines?page=${this.currentPage}&pageSize=${this.pageSize}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        this.allMedicines = data.items || [];
        this.totalPages = data.totalPages || 1;
        this.totalCount = data.totalCount || 0;
        this.applyFilters();
      })
      .catch(err => {
        console.error('API error:', err);
      });
  }

  applyFilters() {
    let filtered = this.allMedicines;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(med =>
        (med.englishMedicineName && med.englishMedicineName.toLowerCase().includes(term)) ||
        (med.arabicMedicineName && med.arabicMedicineName.includes(term))
      );
    }
    if (this.selectedDrug !== '') {
      filtered = filtered.filter(med => String(med.drug) === this.selectedDrug);
    }
    this.medicines = filtered;
  }

  onSearchInput() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedDrug = '';
    this.applyFilters();
  }

  getDrugText(drug: number): string {
    switch (drug) {
      case 0:
        return 'دواء';
      case 1:
        return 'مستحضرات تجميل';
      default:
        return 'غير محدد';
    }
  }

  confirmDeleteMedicine(medicineId: number) {
    if (!this.isWarehouseTrusted) {
      alert('عذراً، المستودع غير موثوق. لا يمكن حذف الأدوية.');
      return;
    }
    
    // Find the medicine details
    this.medicineToDelete = this.medicines.find(m => m.medicineId === medicineId);
    this.medicineIdToDelete = medicineId;
    this.showConfirmModal = true;
  }

  closeDeleteModal() {
    this.showConfirmModal = false;
    this.medicineIdToDelete = null;
    this.medicineToDelete = null;
    this.deleting = false;
  }

  deleteMedicineConfirmed() {
    if (!this.medicineIdToDelete) return;
    
    this.deleting = true;
    this.deleteMedicine(this.medicineIdToDelete);
  }

  deleteMedicine(medicineId: number) {
    const warehouseId = localStorage.getItem('warehouseId');
    if (!warehouseId || warehouseId === 'null') {
      alert('لم يتم العثور على رقم المستودع. الرجاء تسجيل الدخول مرة أخرى.');
      this.closeDeleteModal();
      return;
    }
    
    this.http.delete(`https://localhost:7250/api/WarehouseMedicine/DeleteMedicine/${medicineId}?warehouseId=${warehouseId}`).subscribe({
      next: () => {
        this.medicines = this.medicines.filter(m => m.medicineId !== medicineId);
        this.closeDeleteModal();
        alert('تم حذف الدواء بنجاح.');
      },
      error: (err) => {
        this.deleting = false;
        alert('حدث خطأ أثناء حذف الدواء.');
        console.error(err);
      }
    });
  }

  getTrustStatusMessage(): string {
    if (this.checkingTrustStatus) return 'جاري التحقق من حالة الثقة...';
    if (this.isWarehouseTrusted) return 'المستودع موثوق - يمكن تعديل وحذف الأدوية';
    return 'المستودع غير موثوق - لا يمكن تعديل أو حذف الأدوية';
  }

  getTrustStatusClass(): string {
    if (this.checkingTrustStatus) return 'text-info';
    return this.isWarehouseTrusted ? 'text-success' : 'text-danger';
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchMedicines();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.fetchMedicines();
    }
  }
} 