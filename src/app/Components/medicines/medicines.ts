import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './medicines.html',
  styleUrls: ['./medicines.css'],
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
  uploading: boolean = false;

  // Search and filter
  searchTerm: string = '';
  selectedDrug: string = '';
  drugOptions = [
    { value: '', label: 'كل الأنواع' },
    { value: '1', label: 'أدوية' },
    { value: '0', label: 'مستحضرات تجميل' },
  ];

  showConfirmModal: boolean = false;
  medicineIdToDelete: number | null = null;
  medicineToDelete: any = null;
  deleting: boolean = false;
  uploadedFileName: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const warehouseData = JSON.parse(
      localStorage.getItem('warehouseData') || '{}'
    );
    this.warehouseId = warehouseData?.id;
    this.checkWarehouseTrustStatus();
  }

  checkWarehouseTrustStatus() {
    // console.log('Checking trust status for warehouse:', this.warehouseId);

    fetch(`http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/Getbyid/${this.warehouseId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`فشل في جلب بيانات المستودع: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // console.log('Warehouse data for trust check:', data);
        this.isWarehouseTrusted = data.isTrusted || false;
        this.checkingTrustStatus = false;

        this.fetchMedicines();
      })
      .catch((err) => {
        // console.error('Error checking warehouse trust status:', err);
        this.isWarehouseTrusted = false;
        this.checkingTrustStatus = false;
        this.fetchMedicines();
      });
  }

  fetchMedicines() {
    const url = `http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/GetWarehousMedicines/${this.warehouseId}/medicines?page=${this.currentPage}&pageSize=${this.pageSize}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        this.allMedicines = data.items || [];
        this.totalPages = data.totalPages || 1;
        this.totalCount = data.totalCount || 0;
        this.applyFilters();
      })
      .catch((err) => {
        // console.error('API error:', err);
      });
  }

  applyFilters() {
    let filtered = this.allMedicines;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          (med.englishMedicineName &&
            med.englishMedicineName.toLowerCase().includes(term)) ||
          (med.arabicMedicineName && med.arabicMedicineName.includes(term))
      );
    }
    if (this.selectedDrug !== '') {
      filtered = filtered.filter(
        (med) => String(med.drug) === this.selectedDrug
      );
    }
    // order by arabicMedicineName
    filtered.sort((a, b) =>
      (a.englishMedicineName || '').localeCompare(b.englishMedicineName || '')
    );
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
        return 'مستحضرات تجميل';
      case 1:
        return 'دواء';
      default:
        return 'غير محدد';
    }
  }

  confirmDeleteMedicine(medicineId: number) {
    if (!this.isWarehouseTrusted) {
      alert('عذراً، المستودع غير موثوق. لا يمكن حذف الأدوية.');
      return;
    }

    this.medicineToDelete = this.medicines.find(
      (m) => m.medicineId === medicineId
    );
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

    this.http
      .delete(
        `http://www.PharmaAtOncePreDeploy.somee.com/api/WarehouseMedicine/DeleteMedicine/${medicineId}?warehouseId=${warehouseId}`
      )
      .subscribe({
        next: () => {
          this.medicines = this.medicines.filter(
            (m) => m.medicineId !== medicineId
          );
          this.allMedicines = this.allMedicines.filter(
            (m) => m.medicineId !== medicineId
          );
          this.totalCount--;
          this.closeDeleteModal();
          alert('تم حذف الدواء بنجاح.✅✅');
        },
        error: (err) => {
          this.deleting = false;
          alert('حدث خطأ أثناء حذف الدواء.');
          // console.error(err);
        },
      });
  }

  getTrustStatusMessage(): string {
    if (this.checkingTrustStatus) return 'جاري التحقق من حالة الثقة...';
    if (this.isWarehouseTrusted)
      return 'المستودع موثوق - يمكن تعديل وحذف الأدوية';
    return 'المستودع غير موثوق - لا يمكن تعديل أو حذف الأدوية';
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

  async onExcelUpload(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploadedFileName = file.name;
    this.uploading = true;

    try {
      const fileData = await this.readFileAsync(file);
      const workbook = XLSX.read(fileData, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      // console.log('Parsed Excel first row:', data[0]);

      // Filter only items with IsExist = 1
      const filteredData = data.filter(
        (row: any) => Number(row['IsExist']) === 1
      );

      // ✅ check duplicate IDs inside Excel file
      const ids = filteredData.map((r: any) => Number(r['ID']));
      const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (duplicateIds.length > 0) {
        alert(
          ` يوجد IDs مكررة داخل الملف: ${[...new Set(duplicateIds)].join(
            '. '
          )}⚠️⚠️`
        );
        this.uploading = false;
        if (event.target) event.target.value = '';
        return;
      }

      // Prepare data for API
      const medicinesToUpload = filteredData.map((row: any) => ({
        medicineId: Number(row['ID']),
        quantity: Number(row['Quantity']),
        discount: Number(row['Discount'])/100,
      }));

      // Fetch medicine details and prepare for display
      const mappedMedicines = await Promise.all(
        filteredData.map(async (row: any) => {
          try {
            const response = await fetch(
              `http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/GetMedicine/${row['ID']}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!response.ok) {
              throw new Error(`API error for ID ${row['ID']}`);
            }

            const medData = await response.json();
            // console.log('Fetched medicine data:', medData);

            // ✅ check if Drug matches DB value
            if (Number(row['drug']) !== medData.drug) {
              alert(
                ` الدواء ID ${row['ID']} له قيمة Drug مختلفة عن قاعدة البيانات (ملف: ${row['drug']} - DB: ${medData.drug})⚠️⚠️`
              );
            }

            // ✅ check if ID already exists in this.allMedicines
            if (
              this.allMedicines.some((m) => m.medicineId === Number(row['ID']))
            ) {
              alert(` الدواء ID ${row['ID']} موجود بالفعل في المستودع.⚠️⚠️`);
            }

            return {
              medicineId: Number(row['ID']),
              arabicMedicineName: row['product_name'],
              englishMedicineName: row['product_name_en'],
              drug: Number(row['drug']),
              price: medData.price,
              finalprice: medData.price - medData.price * Number(row['Discount']), 
              quantity: Number(row['Quantity']),
              discount: Number(row['Discount']),
            };
          } catch (err) {
            return null;
          }
        })
      );

      const validMedicines = mappedMedicines.filter((m) => m !== null);

      // ✅ Check if there are changes before sending to server
      const changesExist = this.hasChanges(validMedicines, this.allMedicines);

      // if (!changesExist) {
      //   alert(' ملحوظةالملف مرفوع بالفعل ولا يحتوي على أي تغييرات.⚠️⚠️');
      //   this.uploading = false;
      //   if (event.target) event.target.value = '';
      //   return;
      // }

      // Update local state (merge updates)
      validMedicines.forEach((newMed) => {
        const index = this.allMedicines.findIndex(
          (m) => m.medicineId === newMed.medicineId
        );
        if (index !== -1) {
          this.allMedicines[index] = { ...this.allMedicines[index], ...newMed };
        } else {
          this.allMedicines.push(newMed);
          this.totalCount++;
        }
      });
      this.applyFilters();

      // Send update to server
      const url = `http://www.PharmaAtOncePreDeploy.somee.com/api/Warehouse/UpdateWarehouseMedicines/${this.warehouseId}`;
      const token = localStorage.getItem('authToken');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicinesToUpload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Server returned ${response.status}: ${errorText}`);
        alert(
          'ملحوظة: هذا الملف تم رفعه من قبل بدون أي تغييرات، تم قبول إعادة الرفع مرة أخري. ⚠⚠'
        );
      }

      alert('تم رفع وتحديث الأدوية بنجاح .✅✅');

      // Refresh data from server to ensure consistency
      this.fetchMedicines();
    } catch (error) {
      // console.error('Error processing Excel file:', error);
      alert('حدث خطأ أثناء معالجة الملف. حاول مرة أخرى.');
    } finally {
      this.uploading = false;
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  private readFileAsync(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private hasChanges(newData: any[], existingData: any[]): boolean {
    if (newData.length !== existingData.length) return true;

    return newData.some((newMed) => {
      const oldMed = existingData.find(
        (m) => m.medicineId === newMed.medicineId
      );
      if (!oldMed) return true;
      return (
        oldMed.quantity !== newMed.quantity ||
        oldMed.discount !== newMed.discount ||
        oldMed.price !== newMed.price
      );
    });
  }
}
